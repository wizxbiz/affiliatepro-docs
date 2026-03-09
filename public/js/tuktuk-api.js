/**
 * 🚀 TukTuk API Service - Web Version
 * ===================================
 * Bridges the Web App / LINE LIFF with the TukTuk Go Engine (Fly.io)
 * Automatically handles IAM (Bearer Token) via AuthService
 */

class TuktukAPI {
    constructor() {
        this.baseUrl = null;
    }

    init() {
        if (window.AuthService) {
            this.baseUrl = window.AuthService.getBackendUrl();
            console.log("✅ TuktukAPI Initialized with URL:", this.baseUrl);
        }
    }

    async getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'X-TukTuk-Source': 'TukTuk-Web-App' // ✅ Required by Go Backend IAM
        };

        if (window.AuthService) {
            const token = await window.AuthService.getIDToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }
        return headers;
    }

    async getAnalyticsSeller(sellerId) {
        try {
            const url = `${this.baseUrl}/analytics/seller/${sellerId}`;
            const response = await fetch(url, {
                headers: await this.getHeaders()
            });
            return await response.json();
        } catch (e) {
            console.error("API Error (getAnalyticsSeller):", e);
            return { error: true, message: e.message };
        }
    }

    async getCommunityAnalytics(province = "all") {
        try {
            const url = `${this.baseUrl}/analytics/community?province=${province}`;
            const response = await fetch(url, {
                headers: await this.getHeaders()
            });
            return await response.json();
        } catch (e) {
            console.error("API Error (getCommunityAnalytics):", e);
            return { error: true, message: e.message };
        }
    }

    // Add more methods as needed for Marketplace, CRM, etc.
}

window.TuktukAPI = new TuktukAPI();

document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for AuthService to init
    setTimeout(() => {
        window.TuktukAPI.init();
    }, 200);
});
