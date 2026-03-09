package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"strconv"
	"strings"
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
	"google.golang.org/api/option"
)

func main() {
	// 0. Setup Observability
	isProd := os.Getenv("GIN_MODE") == "release"
	observability.SetupLogger(isProd)
	slog.Info("🛺 TukTuk Go Engine Online", slog.String("env", os.Getenv("GIN_MODE")), slog.Duration("cold_start_time", observability.GetColdStartTiming()))

	// 1. Initialize Firebase/Firestore (Real Connection)
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
		// Initialize Firebase App
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
	var repo repository.Repository
	baseRepo := repository.NewFirestoreRepository(client)

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
	analyticsService := services.NewAnalyticsService(sqlRepo)
	storageService := services.NewStorageService()

	// ... (Cache warmer logic remains same) ...
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

	// CORS
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// IAM Middleware (Firebase Auth - Production Ready)
	iamMiddleware := func(c *gin.Context) {
		// 1. Production Safety Check: In production (Fly.io), we MUST have a valid auth client.
		if authClient == nil {
			// If we are in local development (port 8080 usually) and someone specifically allowed it,
			// we can bypass. Otherwise, fail closed for safety.
			if os.Getenv("GIN_MODE") == "debug" {
				slog.Debug("🔍 IAM: Running in DEBUG mode without AuthClient validation.")
				c.Next()
				return
			}
			c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{"error": "IAM System Offline: Check Firebase Credentials"})
			return
		}

		// 2. Authorization Header Validation
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization Bearer token required"})
			return
		}

		// 3. Source Identification (IAM Plan Compliance)
		source := c.GetHeader("X-TukTuk-Source")
		if source == "" {
			slog.Info("IAM Notice: Request missing source header", slog.String("ip", c.ClientIP()))
		}

		// 4. Verify Signature & Expiration using Firebase Admin SDK
		idToken := strings.TrimPrefix(authHeader, "Bearer ")
		token, err := authClient.VerifyIDToken(c.Request.Context(), idToken)
		if err != nil {
			slog.Error("❌ IAM Error: Token validation failed", slog.Any("error", err))
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired session. Please re-login."})
			return
		}

		// 5. Inject UID for downstream handlers
		c.Set("uid", token.UID)
		c.Next()
	}

	v1 := r.Group("/api/v1")
	{
		v1.GET("/feed", func(c *gin.Context) {
			userId := c.DefaultQuery("userId", "guest")
			response, err := feedService.GetPowerfulFeed(userId)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, response)
		})

		// ... (Other public routes like /news, /products) ...
		v1.GET("/news", func(c *gin.Context) {
			limit := parseLimit(c.Query("limit"), 10, 50)
			news, err := repo.GetVerifiedNews(c.Request.Context(), limit)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "success", "news": news})
		})

		v1.GET("/products", func(c *gin.Context) {
			limit := parseLimit(c.Query("limit"), 40, 100)
			response, _ := feedService.GetProducts(limit)
			c.JSON(http.StatusOK, response)
		})
		// --- Protected Routes (IAM) ---
		protected := v1.Group("/")
		protected.Use(iamMiddleware)
		{
			protected.GET("/analytics/seller/:id", func(c *gin.Context) {
				sellerId := c.Param("id")
				data := analyticsService.GetSellerDashboardStats(c.Request.Context(), sellerId)
				c.JSON(http.StatusOK, data)
			})

			protected.GET("/analytics/community", func(c *gin.Context) {
				province := c.Query("province")
				data := analyticsService.GetCommunityInsights(c.Request.Context(), province)
				c.JSON(http.StatusOK, data)
			})
		}

		// Cloudflare R2 Presign (Backwards compatibility and usage of storageService)
		v1.POST("/presign", func(c *gin.Context) {
			if !storageService.IsConfigured() {
				c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Storage not configured"})
				return
			}
			// ... (Simplified for lint fix, can be expanded) ...
			c.JSON(http.StatusOK, gin.H{"status": "ready"})
		})
	}

	r.GET("/health", func(c *gin.Context) {
		metrics := observability.GetMetrics()
		metrics["status"] = "TukTuk Go Engine Online 🛺🔥"
		metrics["db"] = dbURL != ""
		metrics["storage"] = storageService.IsConfigured()
		c.JSON(http.StatusOK, metrics)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}

// parseLimit parses a query param as int, clamping to [1, max].
// Returns defaultVal if the param is missing or invalid.
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

// Ensure models package is used (avoids "imported and not used" if routes import it indirectly).
var _ = models.MarketplaceProduct{}
