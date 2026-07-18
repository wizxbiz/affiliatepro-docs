/**
 * TukTuk Telemetry & AI Personalization Tracking
 * Phase 2 - Capturing user intent, watch time, and engagement 
 * to pipeline into Vertex AI / Recommendation Engine.
 */
class TukTukTelemetry {
    constructor() {
        this.sessionData = {
            sessionId: this.generateSessionId(),
            startTime: Date.now(),
            events: [],
            videoWatchStats: {}
        };
        const apiBase = (window.TUKTUK_LIFF && window.TUKTUK_LIFF.apiBase) || '';
        this.telemetryEndpoint = apiBase ? apiBase + '/api/v1/telemetry' : '';
        this.batchSize = 10;
        this.initListeners();

        // Push batch periodically
        setInterval(() => this.flushData(), 15000);

        // Push on exit
        window.addEventListener('beforeunload', () => this.flushData(true));
    }

    generateSessionId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    initListeners() {
        // Track Scroll Depth
        let maxScroll = 0;
        window.addEventListener('scroll', () => {
            const currentScroll = window.scrollY + window.innerHeight;
            if (currentScroll > maxScroll + 500) {
                maxScroll = currentScroll;
                this.logEvent('scroll_depth_reached', { depth: maxScroll });
            }
        }, { passive: true });

        // Global click tracking for specific data-attributes
        document.addEventListener('click', (e) => {
            const trackingEl = e.target.closest('[data-track-click]');
            if (trackingEl) {
                this.logEvent('click', {
                    targetId: trackingEl.id || trackingEl.getAttribute('data-track-click'),
                    text: trackingEl.innerText.substring(0, 30)
                });
            }
        });
    }

    // Call this when a video starts playing
    trackVideoStart(videoId, category) {
        this.sessionData.videoWatchStats[videoId] = {
            startTime: Date.now(),
            category: category,
            totalWatchTime: 0
        };
        this.logEvent('video_start', { videoId, category });
    }

    // Call this when video pauses or user scrolls past it
    trackVideoStop(videoId) {
        let stat = this.sessionData.videoWatchStats[videoId];
        if (stat && stat.startTime) {
            const watchedMs = Date.now() - stat.startTime;
            stat.totalWatchTime += watchedMs;
            stat.startTime = null; // reset
            this.logEvent('video_watch_duration', {
                videoId,
                category: stat.category,
                durationMs: watchedMs,
                totalAccumulatedMs: stat.totalWatchTime
            });
        }
    }

    logEvent(eventType, metadata = {}) {
        const event = {
            type: eventType,
            timestamp: Date.now(),
            data: metadata
        };
        this.sessionData.events.push(event);

        // If we reach batch size, send it
        if (this.sessionData.events.length >= this.batchSize) {
            this.flushData();
        }
    }

    async flushData(isUnloading = false) {
        if (!this.telemetryEndpoint || this.sessionData.events.length === 0) return;

        const payload = {
            sessionId: this.sessionData.sessionId,
            userId: localStorage.getItem('tuktuk_user_id') || 'anonymous',
            events: [...this.sessionData.events],
            durationSoFar: Date.now() - this.sessionData.startTime
        };

        // Clear queued events
        this.sessionData.events = [];

        try {
            // Using navigator.sendBeacon for reliable delivery during unload
            if (isUnloading && navigator.sendBeacon) {
                const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
                navigator.sendBeacon(this.telemetryEndpoint, blob);
            } else {
                fetch(this.telemetryEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    keepalive: isUnloading // Fallback if beacon fails
                }).catch(e => console.warn('Telemetry error', e));
            }
        } catch (e) {
            console.warn('Telemetry push failed', e);
        }
    }
}

// Initialize globallly
window.tuktukTelemetry = new TukTukTelemetry();
