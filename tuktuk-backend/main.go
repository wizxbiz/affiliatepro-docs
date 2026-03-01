package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"tuktuk-backend/internal/cache"
	"tuktuk-backend/internal/models"
	"tuktuk-backend/internal/repository"
	"tuktuk-backend/internal/services"

	"cloud.google.com/go/firestore"
	"github.com/gin-gonic/gin"
	"google.golang.org/api/option"
)

func main() {
	// 1. Initialize Firebase/Firestore (Real Connection)
	ctx := context.Background()

	// TIP: In a real production, use environment variable for credential path
	// For now, we'll try to load it if exists, or run in 'demo' mode
	var client *firestore.Client
	var err error
	_ = err // Ignore unused err for now

	credPath := "serviceAccountKey.json"
	if _, err := os.Stat(credPath); err == nil {
		client, err = firestore.NewClient(ctx, "appinjproject", option.WithCredentialsFile(credPath))
		if err != nil {
			log.Printf("Failed to create firestore client: %v. Running in mock mode.\n", err)
		} else {
			log.Println("✅ Successfully connected to Firestore")
			defer client.Close()
		}
	} else {
		log.Println("⚠️ serviceAccountKey.json not found. Backend will run in demo/mock mode.")
	}

	// 2. Setup Dependency Injection
	var repo repository.Repository
	if client != nil {
		baseRepo := repository.NewFirestoreRepository(client)
		redisAddr := os.Getenv("REDIS_ADDR")
		if redisAddr != "" {
			log.Printf("Connecting to Redis at %s...", redisAddr)
			cacheSvc := cache.NewRedisCache(redisAddr, os.Getenv("REDIS_PASSWORD"), 0)
			repo = repository.NewRedisRepository(baseRepo, cacheSvc)
			log.Println("✅ Redis Caching Layer Enabled")
		} else {
			log.Println("⚠️ REDIS_ADDR not set. Running without caching layer.")
			repo = baseRepo
		}
	} else {
		// You could implement a MockRepository here for testing
		// For brevity, we'll use a dummy implementation or just handle nils in service
		repo = repository.NewFirestoreRepository(nil)
	}

	feedService := services.NewFeedService(repo)
	analyticsService := services.NewAnalyticsService()

	// 3. Gin Router with Performance Middlewares
	r := gin.New()

	// Add CORS middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	r.Use(gin.Logger())   // Standard logging
	r.Use(gin.Recovery()) // Recovery from panics (highly recommended for Go)

	// 4. API Routes
	v1 := r.Group("/api/v1")
	{
		// The Powerful Feed endpoint
		v1.GET("/feed", func(c *gin.Context) {
			userId := c.DefaultQuery("userId", "guest")

			response, err := feedService.GetPowerfulFeed(userId)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, response)
		})

		v1.GET("/trending", func(c *gin.Context) {
			response, err := feedService.GetTrendingFeed()
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, response)
		})

		v1.POST("/posts/:id/like", func(c *gin.Context) {
			postId := c.Param("id")
			userId := c.Query("userId")
			if userId == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "userId is required"})
				return
			}
			liked, err := feedService.ToggleLike(userId, postId)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"liked": liked})
		})

		v1.POST("/posts/:id/view", func(c *gin.Context) {
			postId := c.Param("id")
			err := feedService.MarkAsViewed(postId)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "viewed"})
		})

		v1.POST("/telemetry", func(c *gin.Context) {
			var payload models.TelemetryPayload
			if err := c.ShouldBindJSON(&payload); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
				return
			}

			// Fire & Forget Background Worker for AI Pipeline
			go func() {
				// E.g., Push to Vertex AI or write to BigQuery/Firestore
				log.Printf("📊 [Telemetry] Session %s from User %s recorded %d events (duration: %d ms)",
					payload.SessionID, payload.UserID, len(payload.Events), payload.DurationSoFar)
			}()

			c.JSON(http.StatusAccepted, gin.H{"status": "queued limit processed"})
		})

		// Advanced Analytics Routes
		v1.GET("/analytics/seller/:id", func(c *gin.Context) {
			sellerId := c.Param("id")
			if sellerId == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "sellerId is required"})
				return
			}
			data := analyticsService.GetSellerDashboardStats(sellerId)
			c.JSON(http.StatusOK, data)
		})

		v1.POST("/analytics/live_event", func(c *gin.Context) {
			type LiveEventPayload struct {
				StreamID  string `json:"streamId"`
				EventType string `json:"eventType"`
				UserID    string `json:"userId"`
			}
			var payload LiveEventPayload
			if err := c.ShouldBindJSON(&payload); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
				return
			}
			analyticsService.LogLiveCommerceEvent(payload.StreamID, payload.EventType, payload.UserID)
			c.JSON(http.StatusOK, gin.H{"status": "event_logged"})
		})
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "TukTuk Go Ultra Backend is Online 🛺🔥",
			"mode": func() string {
				if client == nil {
					return "Demo"
				}
				return "Production"
			}(),
		})
	})

	// Start Engine
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("🚀 TukTuk Engine starting on port %s", port)
	r.Run(":" + port)
}
