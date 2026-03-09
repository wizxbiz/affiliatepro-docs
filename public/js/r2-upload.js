/**
 * TukTuk R2 Upload Helper
 * ─────────────────────────────────────────────────────────────────────────────
 * Exposes:
 *   window.uploadToR2(file, folder, onProgress?) → Promise<string|null>
 *   window.r2Upload   ← alias for the same function
 *
 * Flow:
 *   1. POST to Go backend /api/v1/presign  → { uploadUrl, publicUrl, key }
 *   2. PUT file bytes directly to R2 via XHR (for progress events)
 *   3. Returns publicUrl on success
 *   4. Falls back to Firebase Storage if Go backend is unavailable
 *
 * Config:
 *   Reads window.TUKTUK_LIFF.apiBase for the Go backend URL.
 *   If not set, falls back to Firebase Storage silently.
 *
 * Usage:
 *   <!-- Before r2-upload.js: -->
 *   <script src="/js/liff-config.js"></script>
 *   <script src="/js/r2-upload.js"></script>
 *
 *   const url = await uploadToR2(fileInput.files[0], 'community', pct => console.log(pct+'%'));
 */
(function () {
    'use strict';

    // ── Helpers ───────────────────────────────────────────────────────────────

    function getApiBase() {
        return ((window.TUKTUK_LIFF || {}).apiBase || '').replace(/\/$/, '');
    }

    function guessContentType(filename) {
        const ext = (filename.split('.').pop() || '').toLowerCase();
        const map = {
            mp4: 'video/mp4', mov: 'video/quicktime', avi: 'video/x-msvideo',
            mkv: 'video/x-matroska', webm: 'video/webm',
            jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
            webp: 'image/webp', gif: 'image/gif', heic: 'image/heic',
            pdf: 'application/pdf',
        };
        return map[ext] || 'application/octet-stream';
    }

    // ── Step 1: Get presigned PUT URL from Go backend ─────────────────────────

    async function getPresignedUrl(filename, folder, contentType, expirySecs) {
        const base = getApiBase();
        if (!base) return null;

        try {
            const resp = await fetch(base + '/api/v1/presign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename,
                    folder,
                    contentType,
                    expirySecs: expirySecs || 3600,
                }),
            });
            if (!resp.ok) {
                console.warn('[r2Upload] Presign HTTP', resp.status);
                return null;
            }
            return await resp.json(); // { uploadUrl, publicUrl, key }
        } catch (e) {
            console.warn('[r2Upload] Presign request failed:', e.message);
            return null;
        }
    }

    // ── Step 2: PUT file to R2 via XHR ───────────────────────────────────────

    function putToR2(uploadUrl, file, contentType, onProgress) {
        return new Promise(function (resolve, reject) {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', uploadUrl, true);
            xhr.setRequestHeader('Content-Type', contentType);

            if (typeof onProgress === 'function') {
                xhr.upload.addEventListener('progress', function (e) {
                    if (e.lengthComputable) {
                        onProgress(Math.round((e.loaded / e.total) * 100));
                    }
                });
            }

            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve();
                } else {
                    reject(new Error('R2 PUT returned HTTP ' + xhr.status));
                }
            };
            xhr.onerror = function () {
                reject(new Error('R2 PUT network error'));
            };

            xhr.send(file);
        });
    }

    // ── Fallback: Firebase Storage ────────────────────────────────────────────

    async function firebaseFallback(file, folder, onProgress) {
        if (typeof firebase === 'undefined') return null;
        const apps = firebase.apps || [];
        if (!apps.length) return null;

        try {
            const path = folder + '/' + Date.now() + '_' + file.name;
            const ref = firebase.storage().ref().child(path);
            const task = ref.put(file);

            if (typeof onProgress === 'function') {
                task.on('state_changed', function (snap) {
                    onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
                });
            }

            await task;
            const url = await ref.getDownloadURL();
            console.log('[r2Upload] Firebase fallback succeeded for:', folder);
            return url;
        } catch (e) {
            console.warn('[r2Upload] Firebase fallback failed:', e.message);
            return null;
        }
    }

    // ── Main export ───────────────────────────────────────────────────────────

    /**
     * Upload a File to Cloudflare R2 (with automatic Firebase Storage fallback).
     *
     * @param {File}     file        - File object from an <input type="file">
     * @param {string}   folder      - Destination folder in R2, e.g. 'community', 'avatars'
     * @param {Function} [onProgress] - Optional progress callback: (percent: number) => void
     * @returns {Promise<string|null>} Public URL of the uploaded file, or null on failure
     */
    async function uploadToR2(file, folder, onProgress) {
        if (!file) return null;

        const ct = guessContentType(file.name);

        // ── Try Go backend presigned URL ──────────────────────────────────────
        try {
            const result = await getPresignedUrl(file.name, folder, ct);
            if (result && result.uploadUrl) {
                await putToR2(result.uploadUrl, file, ct, onProgress);
                console.log('[r2Upload] R2 upload succeeded:', result.publicUrl);
                return result.publicUrl;
            }
        } catch (e) {
            console.warn('[r2Upload] R2 path failed, trying Firebase fallback:', e.message);
        }

        // ── Firebase Storage fallback ─────────────────────────────────────────
        return firebaseFallback(file, folder, onProgress);
    }

    // Expose under two names — community_feed_integration.js checks `uploadToR2`,
    // other code may use `r2Upload`.
    window.uploadToR2 = uploadToR2;
    window.r2Upload   = uploadToR2;

    var base = getApiBase();
    console.log(
        '[r2-upload] Ready. Backend:',
        base || '(not configured — Firebase fallback only)'
    );
}());
