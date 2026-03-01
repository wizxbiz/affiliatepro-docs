/**
 * TukTuk JS Local Cache Manager
 * This offloads the initial load from firebase and the API.
 */
class TukTukCache {
    constructor() {
        this.prefix = 'tuktuk_cache_';
    }

    set(key, data, durationMinutes = 10) {
        const now = new Date();
        const item = {
            value: data,
            expiry: now.getTime() + durationMinutes * 60000,
        };
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(item));
        } catch (e) {
            console.warn('Cache quota exceeded or unavailable');
        }
    }

    get(key) {
        const itemStr = localStorage.getItem(this.prefix + key);
        if (!itemStr) return null;

        try {
            const item = JSON.parse(itemStr);
            const now = new Date();

            if (now.getTime() > item.expiry) {
                localStorage.removeItem(this.prefix + key);
                return null; // Cache expired
            }
            return item.value;
        } catch (e) {
            return null;
        }
    }

    clear() {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
            }
        }
    }
}

const tuktukCache = new TukTukCache();
window.tuktukCache = tuktukCache;
