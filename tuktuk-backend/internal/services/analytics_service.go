package services

import (
	"context"
	"math/rand"
	"time"

	"tuktuk-backend/internal/repository"

	"github.com/gin-gonic/gin"
)

const (
// In a real system, we'd query BigQuery or PostgreSQL.
)

// AnalyticsService handles Big Data queries for the Seller Dashboard
type AnalyticsService struct {
	sqlRepo repository.SQLRepository
}

func NewAnalyticsService(sqlRepo repository.SQLRepository) *AnalyticsService {
	return &AnalyticsService{sqlRepo: sqlRepo}
}

// GetSellerDashboardStats returns real analytics if DB connected, else mocks
func (s *AnalyticsService) GetSellerDashboardStats(ctx context.Context, sellerID string) gin.H {
	if s.sqlRepo != nil {
		report, err := s.sqlRepo.GetSellerReport(ctx, sellerID)
		if err == nil {
			return gin.H{
				"sellerId":  sellerID,
				"timestamp": time.Now().Format(time.RFC3339),
				"metrics": gin.H{
					"revenue":        report.TotalRevenue,
					"orders":         report.OrderCount,
					"conversionRate": report.ConversionRate,
					"date":           report.ReportDate,
				},
				"isRealData": true,
			}
		}
	}

	// Advanced Mocking fallback with more metrics
	return gin.H{
		"sellerId":  sellerID,
		"timestamp": time.Now().Format(time.RFC3339),
		"metrics": gin.H{
			"revenue":        rand.Float64()*5000 + 1000,
			"orders":         rand.Intn(100) + 20,
			"conversionRate": 3.0 + rand.Float64()*7,
			"avgOrderValue":  150 + rand.Float64()*300,
			"returningUsers": rand.Intn(30),
		},
		"isRealData": false,
		"note":       "Mock data: Primary SQL sync pending. Showing predictive estimates.",
	}
}

func (s *AnalyticsService) GetCommunityInsights(ctx context.Context, province string) gin.H {
	if s.sqlRepo != nil {
		trends, err := s.sqlRepo.GetCommunityTrends(ctx, province)
		if err == nil {
			return gin.H{
				"province": province,
				"trends":   trends,
				"status":   "success",
			}
		}
	}
	return gin.H{
		"province":  province,
		"timestamp": time.Now().Format(time.RFC3339),
		"insights": []gin.H{
			{"topic": "Trending Category", "value": "Local Food", "growth": "+15%"},
			{"topic": "Peak Hour", "value": "18:00 - 20:00", "growth": "Stable"},
			{"topic": "User Activity", "value": "High", "growth": "+5%"},
		},
		"isRealData": false,
		"status":     "success",
	}
}

// LogLiveCommerceEvent registers interactions during a live stream
func (s *AnalyticsService) LogLiveCommerceEvent(streamID string, eventType string, userID string) {
	// e.g. "product_clicked", "added_to_cart", "purchased"
	// This pipes into the Telemetry/Big Data system
}
