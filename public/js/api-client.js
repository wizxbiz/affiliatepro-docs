(function () {
    'use strict';

    const DEFAULT_TIMEOUT_MS = 7000;
    const DEFAULT_BASE_URL = '/api/v1';
    const diagnostics = window.TukTukAPI && Array.isArray(window.TukTukAPI.diagnostics)
        ? window.TukTukAPI.diagnostics
        : [];

    function recordApiDiagnostic(event, detail = {}) {
        const entry = {
            at: new Date().toISOString(),
            event,
            ...detail,
        };
        diagnostics.push(entry);
        while (diagnostics.length > 80) diagnostics.shift();

        if (event === 'error' || event === 'timeout') {
            console.warn('[TukTukAPI]', event, detail);
        }
        return entry;
    }

    function parseJsonStorage(key) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (_) {
            return null;
        }
    }

    function getToken() {
        const sessions = [
            parseJsonStorage('wizmobiz_session'),
            parseJsonStorage('tuktuk_line_session'),
            parseJsonStorage('wit_line_session'),
        ];

        return localStorage.getItem('tuktuk_token') ||
            localStorage.getItem('tuktuk_jwt') ||
            sessions.map(session => session && (session.token || session.sessionToken || session.jwt || session.accessToken)).find(Boolean) ||
            null;
    }

    function buildUrl(path, params) {
        const base = (window.TUKTUK_API_BASE || DEFAULT_BASE_URL).replace(/\/+$/, '');
        const url = new URL(`${base}${path}`, window.location.origin);
        Object.entries(params || {}).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '') return;
            url.searchParams.set(key, String(value));
        });
        return url.toString();
    }

    function normalizeError(status, data) {
        const legacy = data && data.error;
        const message = typeof legacy === 'string'
            ? legacy
            : legacy?.message || data?.message || `HTTP ${status}`;
        const code = legacy?.code || data?.code || (status === 401 ? 'UNAUTHORIZED' : 'REQUEST_FAILED');
        const error = new Error(message);
        error.status = status;
        error.code = code;
        error.data = data;
        return error;
    }

    async function fetchJson(path, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS);
        const token = getToken();
        const headers = new Headers(options.headers || {});
        const method = options.method || 'GET';
        const url = buildUrl(path, options.params);
        const startedAt = Date.now();
        headers.set('Accept', 'application/json');
        if (options.body !== undefined) headers.set('Content-Type', 'application/json');
        if (options.auth !== false && token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);

        recordApiDiagnostic('request', {
            path,
            method,
            auth: options.auth !== false && Boolean(token),
            timeoutMs: options.timeoutMs || DEFAULT_TIMEOUT_MS,
        });
        try {
            const response = await fetch(url, {
                method,
                headers,
                body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
                signal: controller.signal,
                credentials: options.credentials || 'same-origin',
            });
            const data = await response.json().catch(() => null);
            if (!response.ok || data?.status === 'error') {
                const error = normalizeError(response.status, data);
                error.__diagnosticRecorded = true;
                recordApiDiagnostic('error', {
                    path,
                    method,
                    status: response.status,
                    code: error.code,
                    message: error.message,
                    durationMs: Date.now() - startedAt,
                });
                throw error;
            }
            recordApiDiagnostic('success', {
                path,
                method,
                status: response.status,
                durationMs: Date.now() - startedAt,
            });
            return data || { status: 'success' };
        } catch (error) {
            if (error.name === 'AbortError') {
                const timeoutError = new Error('Request timed out');
                timeoutError.code = 'TIMEOUT';
                recordApiDiagnostic('timeout', {
                    path,
                    method,
                    message: timeoutError.message,
                    durationMs: Date.now() - startedAt,
                });
                throw timeoutError;
            }
            if (!error.__diagnosticRecorded) {
                recordApiDiagnostic('error', {
                    path,
                    method,
                    status: error.status || null,
                    code: error.code || 'REQUEST_FAILED',
                    message: error.message || String(error),
                    durationMs: Date.now() - startedAt,
                });
            }
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    function productToFeedItem(product) {
        if (!product) return null;
        return {
            ...product,
            id: product.id || product.productId,
            type: 'product',
            source: product.source || 'api-v1-products',
            title: product.title || product.productName || product.name || '',
            productName: product.productName || product.title || product.name || '',
            description: product.description || product.detail || '',
            imageUrl: product.imageUrl || product.displayImage || (Array.isArray(product.images) ? product.images[0] : ''),
            images: Array.isArray(product.images) ? product.images : [product.imageUrl].filter(Boolean),
            sellerName: product.sellerName || product.displayAuthor || 'TukTuk Seller',
            sellerId: product.sellerId || product.lineUserId || product.authorId || null,
            province: product.province || product.sellerProvince || '',
            createdAt: product.createdAt || product.updatedAt || null,
        };
    }

    const api = {
        diagnostics,
        recordDiagnostic: recordApiDiagnostic,
        fetchJson,
        feed: {
            async list(params = {}) {
                return fetchJson('/feed', { params, timeoutMs: params.timeoutMs || 5500, auth: false });
            },
            async trending(params = {}) {
                return fetchJson('/feed/trending', { params, timeoutMs: params.timeoutMs || 5500, auth: false });
            },
        },
        products: {
            async list(params = {}) {
                return fetchJson('/products', { params, timeoutMs: params.timeoutMs || 6500, auth: false });
            },
            async get(id) {
                return fetchJson(`/products/${encodeURIComponent(id)}`, { auth: false });
            },
            productToFeedItem,
        },
        auth: {
            async getSession() {
                return fetchJson('/auth/session');
            },
            async createSession(body = {}) {
                return fetchJson('/auth/session', { method: 'POST', body });
            },
            async logout() {
                return fetchJson('/auth/logout', { method: 'POST' });
            },
        },
    };

    window.TukTukAPI = api;
})();