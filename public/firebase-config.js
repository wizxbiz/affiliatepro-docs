/**
 * FIREBASE CONFIGURATION (SECURE VERSION)
 * 
 * ⚠️ SECURITY NOTE: 
 * Firebase API Keys are intended to be public for client-side use.
 * Security MUST be enforced by:
 * 1. Firebase Security Rules (Firestore/Storage)
 * 2. API Key Restrictions in Google Cloud Console (HTTP Referrer: your-domain.com)
 * 3. Firebase App Check
 */

const firebaseConfig = {
    // These should ideally be injected at build time or fetched from a secure metadata endpoint
    apiKey: "AIzaSyBKL6HBLEndDX4LYo7APFNQ0IVICLJtaIE",
    authDomain: "appinjproject.firebaseapp.com",
    projectId: "appinjproject",
    storageBucket: "appinjproject.firebasestorage.app",
    messagingSenderId: "408718656984",
    appId: "1:408718656984:web:08bd8f084769d428251ead"
};

// Placeholder for fetching config from a secure Proxy (if desired)
const fetchSecureConfig = async () => {
    try {
        // In a real production setup, you would fetch this from your own API
        // const response = await fetch('/api/get-firebase-config');
        // return await response.json();
        return firebaseConfig;
    } catch (e) {
        console.error('Failed to fetch secure config', e);
        return firebaseConfig;
    }
};
