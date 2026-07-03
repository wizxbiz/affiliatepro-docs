package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"
	"tuktuk-backend/internal/cache"
	"tuktuk-backend/internal/models"
	"tuktuk-backend/internal/observability"
	"tuktuk-backend/internal/repository"
	"tuktuk-backend/internal/services"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
	"golang.org/x/time/rate"
	"google.golang.org/api/option"
)

func main() {
	// 0. Setup Observability
	isProd := os.Getenv("GIN_MODE") == "release"
	observability.SetupLogger(isProd)
	slog.Info("🛺 TukTuk Go Engine Online", slog.String("env", os.Getenv("GIN_MODE")), slog.Duration("cold_start_time", observability.GetColdStartTiming()))

	// 1. Initialize Firebase/Firestore
	ctx := context.Background()

	var client *firestore.Client
	var authClient *auth.Client

	var credOpt option.ClientOption
	if jsonCreds := os.Getenv("GOOGLE_CREDENTIALS_JSON"); jsonCreds != "" {
		credOpt = option.WithCredentialsJSON([]byte(jsonCreds))
		slog.Info("🔑 Using GOOGLE_CREDENTIALS_JSON env var")
	} else if _, err := os.Stat("serviceAccountKey.json"); err == nil {
		credOpt = option.WithCredentialsFile("serviceAccountKey.json")
		slog.Info("🔑 Using serviceAccountKey.json file")
	}

	if credOpt != nil {
		app, err := firebase.NewApp(ctx, nil, credOpt)
		if err == nil {
			authClient, err = app.Auth(ctx)
			if err != nil {
				slog.Error("❌ Firebase Auth client failed", slog.Any("error", err))
			}
			client, err = app.Firestore(ctx)
			if err != nil {
				slog.Warn("⚠️ Firestore connect failed", slog.Any("error", err))
			} else {
				slog.Info("✅ Successfully connected to Firestore")
				defer client.Close()
			}
		} else {
			slog.Warn("⚠️ Firebase init failed", slog.Any("error", err))
		}
	}

	// 2. Initialize PostgreSQL
	var sqlRepo repository.SQLRepository
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL != "" {
		db, err := sqlx.Connect("postgres", dbURL)
		if err != nil {
			slog.Warn("⚠️ SQL connect failed. Relational analytics will be mocked.", slog.Any("error", err))
		} else {
			slog.Info("✅ Connected to PostgreSQL")
			sqlRepo = repository.NewSQLRepository(db)
		}
	}

	// 3. Setup Dependency Injection
	var baseRepo repository.Repository
	cfAccountID := os.Getenv("CF_ACCOUNT_ID")
	cfAPIToken := os.Getenv("CF_API_TOKEN")
	d1DatabaseID := os.Getenv("D1_DATABASE_ID")

	if cfAccountID != "" && cfAPIToken != "" && d1DatabaseID != "" {
		slog.Info("☁️ Initializing Cloudflare D1 Repository")
		baseRepo = repository.NewD1Repository(cfAccountID, cfAPIToken, d1DatabaseID)
	} else {
		slog.Info("🔥 Initializing Firebase Firestore Repository")
		baseRepo = repository.NewFirestoreRepository(client)
	}

	var repo repository.Repository
	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr != "" {
		slog.Info("Connecting to Redis", slog.String("address", redisAddr))
		cacheSvc := cache.NewRedisCache(redisAddr, os.Getenv("REDIS_PASSWORD"), 0)
		repo = repository.NewRedisRepository(baseRepo, cacheSvc)
	} else {
		cacheSvc := cache.NewMemoryCache()
		repo = repository.NewRedisRepository(baseRepo, cacheSvc)
	}

	feedService := services.NewFeedService(repo)
	// ✅ NEW: inject Firestore for real user affinity lookups
	if client != nil {
		feedService.SetFirestoreClient(client)
	}
	analyticsService := services.NewAnalyticsService(sqlRepo)
	storageService := services.NewStorageService()

	// Cache warmer goroutine
	go func() {
		if client != nil {
			feedService.WarmAll()
		}
		ticker := time.NewTicker(4 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			if client != nil {
				feedService.WarmAll()
			}
		}
	}()

	// 4. Gin Router
	r := gin.New()
	r.Use(observability.LoggerMiddleware(), gin.Recovery())

	// ✅ Rate Limiting (DDoS Protection) — using stdlib golang.org/x/time/rate
	// Global: 200 requests per minute per IP (~3.3 req/sec)
	globalLimiter := newIPRateLimiter(rate.Limit(3.33), 20)
	r.Use(func(c *gin.Context) {
		lim := globalLimiter.getLimiter(c.ClientIP())
		if !lim.Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "Rate limit exceeded. Try again later."})
			c.Abort()
			return
		}
		c.Next()
	})

	// ✅ NEW: Request ID Middleware (Distributed Tracing)
	r.Use(func(c *gin.Context) {
		reqID := c.GetHeader("X-Request-ID")
		if reqID == "" {
			reqID = generateRequestID()
		}
		c.Set("requestID", reqID)
		c.Header("X-Request-ID", reqID)
		c.Next()
	})

	// CORS
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// IAM Middleware (Firebase Auth)
	iamMiddleware := func(c *gin.Context) {
		if authClient == nil {
			if os.Getenv("GIN_MODE") == "debug" {
				slog.Debug("🔍 IAM: Running in DEBUG mode without AuthClient validation.")
				c.Next()
				return
			}
			c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{"error": "IAM System Offline: Check Firebase Credentials"})
			return
		}

		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization Bearer token required"})
			return
		}

		source := c.GetHeader("X-TukTuk-Source")
		if source == "" {
			slog.Info("IAM Notice: Request missing source header", slog.String("ip", c.ClientIP()))
		}

		idToken := strings.TrimPrefix(authHeader, "Bearer ")
		token, err := authClient.VerifyIDToken(c.Request.Context(), idToken)
		if err != nil {
			slog.Error("❌ IAM Error: Token validation failed", slog.Any("error", err))
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired session. Please re-login."})
			return
		}

		c.Set("uid", token.UID)
		c.Next()
	}

	v1 := r.Group("/api/v1")
	{
		// ── Public Routes ──────────────────────────────────────────────────────

		// Feed: Personalized (Posts + News + Notifications + Trending Tags)
		v1.GET("/feed", func(c *gin.Context) {
			userId := c.DefaultQuery("userId", "guest")
			province := c.Query("province")
			response, err := feedService.GetPowerfulFeed(c.Request.Context(), userId, province)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, response)
		})

		// ✅ NEW: Trending Feed (24h real trending)
		v1.GET("/feed/trending", func(c *gin.Context) {
			response, err := feedService.GetTrendingFeed()
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, response)
		})

		// News
		v1.GET("/news", func(c *gin.Context) {
			limit := parseLimit(c.Query("limit"), 10, 50)
			news, err := repo.GetVerifiedNews(c.Request.Context(), limit)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "success", "news": news})
		})

		// Products
		v1.GET("/products", func(c *gin.Context) {
			limit := parseLimit(c.Query("limit"), 40, 100)
			afterID := c.Query("afterId")
			province := c.Query("province")
			response, _ := feedService.GetProducts(limit, afterID, province)
			c.JSON(http.StatusOK, response)
		})

		v1.GET("/provinces", func(c *gin.Context) {
			var list []models.Province
			for _, p := range models.Provinces {
				list = append(list, p)
			}
			c.JSON(http.StatusOK, gin.H{"status": "ok", "provinces": list})
		})

		// ✅ NEW: Leaderboard
		v1.GET("/leaderboard", func(c *gin.Context) {
			limit := parseLimit(c.Query("limit"), 20, 50)
			response, err := feedService.GetLeaderboard(limit)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, response)
		})

		// ✅ NEW: Live Sessions
		v1.GET("/live", func(c *gin.Context) {
			limit := parseLimit(c.Query("limit"), 10, 30)
			response, err := feedService.GetLiveSessions(limit)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, response)
		})

		// ✅ NEW: Get single Live Session status
		v1.GET("/live/:id", func(c *gin.Context) {
			session, err := feedService.GetLiveSessionStatus(c.Param("id"))
			if err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "success", "session": session})
		})

		// ✅ FIXED: Presign — now actually calls StorageService.GeneratePresignedPutURL
		v1.POST("/presign", func(c *gin.Context) {
			if !storageService.IsConfigured() {
				c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Storage not configured: set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_BASE_URL"})
				return
			}
			var req struct {
				Folder      string `json:"folder" binding:"required"`
				Filename    string `json:"filename" binding:"required"`
				ContentType string `json:"contentType" binding:"required"`
				SizeLimitMB int    `json:"sizeLimitMB"`
				ExpirySecs  int    `json:"expirySecs"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			expiry := req.ExpirySecs
			if expiry <= 0 {
				expiry = 3600 // default 1 hour
			}
			result, err := storageService.GeneratePresignedPutURL(
				req.Folder, req.Filename, req.ContentType, expiry, req.SizeLimitMB,
			)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, result)
		})

		// ── Missing Content APIs ───────────────────────────────────────────

		// ✅ NEW: Search Posts
		v1.GET("/search", func(c *gin.Context) {
			query := c.Query("q")
			limit := parseLimit(c.Query("limit"), 20, 50)
			posts, err := feedService.SearchPosts(query, limit)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "success", "posts": posts})
		})

		// ✅ NEW: Get User Profile + Posts
		v1.GET("/users/:id", func(c *gin.Context) {
			profile, posts, err := feedService.GetUserProfileParams(c.Request.Context(), c.Param("id"))
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "success", "profile": profile, "posts": posts})
		})

		// ✅ NEW: Get single post
		v1.GET("/posts/:id", func(c *gin.Context) {
			post, err := feedService.GetPost(c.Param("id"))
			if err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "success", "post": post})
		})

		// ✅ NEW: Get post comments
		v1.GET("/posts/:id/comments", func(c *gin.Context) {
			limit := parseLimit(c.Query("limit"), 20, 50)
			afterID := c.Query("afterId")
			comments, err := feedService.GetComments(c.Param("id"), limit, afterID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "success", "comments": comments})
		})

		// ── Protected Routes (IAM) ─────────────────────────────────────────────
		protected := v1.Group("/")
		protected.Use(iamMiddleware)

		// More strict limit for writes: 60 per minute (~1 req/sec)
		writeLimiter := newIPRateLimiter(rate.Limit(1), 10)
		protected.Use(func(c *gin.Context) {
			lim := writeLimiter.getLimiter(c.ClientIP())
			if !lim.Allow() {
				c.JSON(http.StatusTooManyRequests, gin.H{"error": "Rate limit exceeded. Try again later."})
				c.Abort()
				return
			}
			c.Next()
		})

		{
			// Analytics: Seller Dashboard
			protected.GET("/analytics/seller/:id", func(c *gin.Context) {
				sellerId := c.Param("id")
				data := analyticsService.GetSellerDashboardStats(c.Request.Context(), sellerId)
				c.JSON(http.StatusOK, data)
			})

			// Analytics: Community insights by province
			protected.GET("/analytics/community", func(c *gin.Context) {
				province := c.Query("province")
				data := analyticsService.GetCommunityInsights(c.Request.Context(), province)
				c.JSON(http.StatusOK, data)
			})

			// ✅ NEW: Create a new Post
			protected.POST("/posts", func(c *gin.Context) {
				var post models.Post
				if err := c.ShouldBindJSON(&post); err != nil {
					c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
					return
				}
				post.AuthorID = c.GetString("uid")
				if err := feedService.CreatePost(&post); err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Post created"})
			})

			// ✅ NEW: Create a Comment
			protected.POST("/posts/:id/comments", func(c *gin.Context) {
				var comment models.Comment
				if err := c.ShouldBindJSON(&comment); err != nil {
					c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
					return
				}
				comment.PostID = c.Param("id")
				comment.AuthorID = c.GetString("uid")
				if err := feedService.CreateComment(&comment); err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Comment added"})
			})

			// ✅ NEW: Toggle Like on a Post
			protected.POST("/posts/:id/like", func(c *gin.Context) {
				uid := c.GetString("uid")
				postID := c.Param("id")
				liked, err := feedService.ToggleLike(uid, postID)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				c.JSON(http.StatusOK, gin.H{"status": "success", "liked": liked, "postId": postID})
			})

			// ✅ NEW: Mark Post as Viewed
			protected.POST("/posts/:id/view", func(c *gin.Context) {
				postID := c.Param("id")
				_ = feedService.MarkAsViewed(postID)
				c.JSON(http.StatusOK, gin.H{"status": "ok", "postId": postID})
			})

			// ✅ NEW: Live Heartbeat (join/leave)
			protected.POST("/live/:id/heartbeat", func(c *gin.Context) {
				sessionID := c.Param("id")
				var body struct {
					Joining bool `json:"joining"`
				}
				_ = c.ShouldBindJSON(&body)
				if err := feedService.LiveHeartbeat(sessionID, body.Joining); err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				c.JSON(http.StatusOK, gin.H{"status": "ok"})
			})
		}
	}

	// ✅ IMPROVED: /health — now checks Firestore connection
	r.GET("/health", func(c *gin.Context) {
		metrics := observability.GetMetrics()
		metrics["status"] = "TukTuk Go Engine Online 🛺🔥"
		metrics["storage"] = storageService.IsConfigured()
		metrics["sql_db"] = dbURL != ""
		metrics["redis"] = redisAddr != ""

		// Real Firestore ping
		if client != nil {
			pingCtx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
			defer cancel()
			_, pingErr := client.Collection("_health").Documents(pingCtx).GetAll()
			metrics["firestore"] = pingErr == nil
		} else {
			metrics["firestore"] = false
			metrics["firestore_note"] = "no credentials configured"
		}

		c.JSON(http.StatusOK, metrics)
	})

	// 5. ✅ NEW: Graceful Shutdown (handles SIGTERM from Fly.io)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		slog.Info("🚀 Server listening", slog.String("port", port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("❌ Server error", slog.Any("error", err))
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGTERM, syscall.SIGINT)
	sig := <-quit
	slog.Info("🛑 Shutdown signal received", slog.String("signal", sig.String()))

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("❌ Forced shutdown", slog.Any("error", err))
	}
	slog.Info("✅ Server gracefully stopped")
}

// parseLimit parses a query param as int, clamping to [1, max].
func parseLimit(s string, defaultVal, max int) int {
	n, err := strconv.Atoi(s)
	if err != nil || n < 1 {
		return defaultVal
	}
	if n > max {
		return max
	}
	return n
}

// generateRequestID creates a short request trace ID from timestamp.
func generateRequestID() string {
	return strconv.FormatInt(time.Now().UnixNano(), 36)
}

// Ensure models package is used.
var _ = models.MarketplaceProduct{}

// ── In-memory IP Rate Limiter ────────────────────────────────────────────────

type ipRateLimiter struct {
	mu       sync.Mutex
	limiters map[string]*rate.Limiter
	r        rate.Limit
	b        int
}

func newIPRateLimiter(r rate.Limit, b int) *ipRateLimiter {
	return &ipRateLimiter{
		limiters: make(map[string]*rate.Limiter),
		r:        r,
		b:        b,
	}
}

func (i *ipRateLimiter) getLimiter(ip string) *rate.Limiter {
	i.mu.Lock()
	defer i.mu.Unlock()
	if lim, ok := i.limiters[ip]; ok {
		return lim
	}
	lim := rate.NewLimiter(i.r, i.b)
	i.limiters[ip] = lim
	return lim
}
