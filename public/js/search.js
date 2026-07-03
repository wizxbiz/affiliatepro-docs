/**
 * TukTuk Search Logic (Shared Web)
 * Handles Fuzzy Search, History, and Filtering
 */

// ── Search History ───────────────────────────────────────────────────────────
class SearchHistory {
    static KEY = 'tuktuk_search_history';
    
    static get() {
        try {
            return JSON.parse(localStorage.getItem(this.KEY) || '[]');
        } catch {
            return [];
        }
    }

    static add(query) {
        if (!query || query.trim().length < 2) return;
        const q = query.trim();
        let history = this.get().filter(x => x !== q); // Remove duplicate
        history.unshift(q); // Add to top
        localStorage.setItem(this.KEY, JSON.stringify(history.slice(0, 10))); // Max 10
    }

    static clear() {
        localStorage.removeItem(this.KEY);
    }
}

// ── Debouncer ────────────────────────────────────────────────────────────────
class Debouncer {
    constructor(ms) {
        this.ms = ms;
        this._timeout = null;
    }

    run(fn) {
        if (this._timeout) clearTimeout(this._timeout);
        this._timeout = setTimeout(fn, this.ms);
    }
}

// ── Fuzzy Scoring ────────────────────────────────────────────────────────────
function fuzzyScore(query, text) {
    if (!text) return 0;
    const q = query.toLowerCase();
    const t = text.toLowerCase();
    
    if (t.includes(q)) return 1.0; // Exact substring match
    
    // Simple char matching
    let qIdx = 0;
    let score = 0;
    for (let i = 0; i < t.length; i++) {
        if (qIdx < q.length && t[i] === q[qIdx]) {
            qIdx++;
            score++;
        }
    }
    
    return qIdx === q.length ? (score / t.length) * 0.8 : 0;
}

// ── Unified Filter & Score ───────────────────────────────────────────────────
function filterAndScoreProducts(products, { query = '', category = 'all', province = '', minPrice, maxPrice, isOtop = false, sortBy = 'newest' }) {
    let results = products.filter(p => {
        if (isOtop && p.source !== 'community') return false;
        if (category !== 'all' && p.category !== category) return false;
        if (province && p.province !== province) return false;
        
        const price = parseFloat(p.price || 0);
        if (minPrice != null && price < minPrice) return false;
        if (maxPrice != null && price > maxPrice) return false;
        
        return true;
    });

    if (query && query.trim()) {
        const q = query.trim();
        results = results.map(p => ({
            ...p,
            _score: (fuzzyScore(q, p.productName) * 3) + 
                    (fuzzyScore(q, p.description) * 1) +
                    ((p.tags || []).some(t => t.toLowerCase().includes(q.toLowerCase())) ? 2 : 0)
        })).filter(p => p._score > 0).sort((a, b) => b._score - a._score);
    } else {
        // Sort without query
        if (sortBy === 'price_asc') results.sort((a, b) => (parseFloat(a.price)||0) - (parseFloat(b.price)||0));
        else if (sortBy === 'price_desc') results.sort((a, b) => (parseFloat(b.price)||0) - (parseFloat(a.price)||0));
        else if (sortBy === 'popular') results.sort((a, b) => (b.viewCount||0) - (a.viewCount||0));
        // else newest (default)
    }

    return results;
}

// ── Namespace Export (backward-compat for marketplace.html) ──────────────────
window.TukTukSearch = { SearchHistory, Debouncer, fuzzyScore, filterAndScoreProducts };