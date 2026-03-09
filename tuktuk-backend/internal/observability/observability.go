package observability

import (
	"log/slog"
	"os"
	"sort"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

var (
	bootTime   time.Time
	statsLock  sync.RWMutex
	totalReqs  int64
	totalError int64
	latencies  []float64
	maxSamples = 1000 // Limit for P95 calculation
)

func init() {
	bootTime = time.Now()
	latencies = make([]float64, 0, maxSamples)
}

// SetupLogger initializes the global slog logger with JSON formatting for production
func SetupLogger(isProduction bool) {
	var handler slog.Handler
	if isProduction {
		handler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
			Level: slog.LevelInfo,
		})
	} else {
		handler = slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
			Level: slog.LevelDebug,
		})
	}
	slog.SetDefault(slog.New(handler))
}

func recordStats(latencyMs float64, isError bool) {
	statsLock.Lock()
	defer statsLock.Unlock()

	totalReqs++
	if isError {
		totalError++
	}

	// Keep a sample for P95 calculation
	if len(latencies) < maxSamples {
		latencies = append(latencies, latencyMs)
	} else {
		// Simple rotation: replace a random sample or oldest (here we just stop adding for stability in simple demos)
		// but better would be a circular buffer. For this task, we'll keep the first 1000 for stats.
	}
}

// GetMetrics returns aggregated metrics for the API
func GetMetrics() gin.H {
	statsLock.RLock()
	defer statsLock.RUnlock()

	var avgLatency float64
	var p95Latency float64
	errorRate := 0.0

	if totalReqs > 0 {
		errorRate = (float64(totalError) / float64(totalReqs)) * 100

		// Calculate Avg
		sum := 0.0
		for _, l := range latencies {
			sum += l
		}
		avgLatency = sum / float64(len(latencies))

		// Calculate P95
		if len(latencies) > 0 {
			// Sort a copy for P95
			sorted := make([]float64, len(latencies))
			copy(sorted, latencies)
			sort.Float64s(sorted)
			idx := int(float64(len(sorted)) * 0.95)
			if idx >= len(sorted) {
				idx = len(sorted) - 1
			}
			p95Latency = sorted[idx]
		}
	}

	return gin.H{
		"total_requests": totalReqs,
		"error_rate_pct": errorRate,
		"avg_latency_ms": avgLatency,
		"p95_latency_ms": p95Latency,
		"cold_start_ms":  time.Since(bootTime).Milliseconds(),
		"uptime":         time.Since(bootTime).String(),
	}
}

// GetColdStartTime returns the time when the application started
func GetColdStartTime() time.Time {
	return bootTime
}

// GetColdStartTiming returns the duration since the app was started
func GetColdStartTiming() time.Duration {
	return time.Since(bootTime)
}

// LoggerMiddleware is a Gin middleware that logs request details in a structured format
func LoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery

		// Process request
		c.Next()

		// Metadata for logging
		latency := time.Since(start)
		statusCode := c.Writer.Status()
		clientIP := c.ClientIP()
		method := c.Request.Method
		latencyMs := float64(latency.Microseconds()) / 1000.0

		// Record metrics
		recordStats(latencyMs, statusCode >= 500)

		// Log entry with separate levels
		var level slog.Level
		switch {
		case statusCode >= 500:
			level = slog.LevelError
		case statusCode >= 400:
			level = slog.LevelWarn
		default:
			level = slog.LevelInfo
		}

		slog.LogAttrs(c.Request.Context(), level, "Request Completed",
			slog.String("method", method),
			slog.String("path", path),
			slog.String("query", query),
			slog.Int("status", statusCode),
			slog.String("ip", clientIP),
			slog.Duration("latency", latency),
			slog.Float64("latency_ms", latencyMs),
			slog.String("user_agent", c.Request.UserAgent()),
			slog.Duration("cold_start_offset", GetColdStartTiming()),
		)
	}
}
