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

	// Mocking fallback
	return gin.H{
		"sellerId":  sellerID,
		"timestamp": time.Now().Format(time.RFC3339),
		"metrics": gin.H{
			"revenue":        rand.Float64()*1000 + 500,
			"orders":         rand.Intn(50),
			"conversionRate": 2.5 + rand.Float64()*5,
		},
		"isRealData": false,
		"note":       "Mock data: PostgreSQL not synced for this seller yet.",
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
	return gin.H{"status": "error", "message": "No SQL data available"}
}

// LogLiveCommerceEvent registers interactions during a live stream
func (s *AnalyticsService) LogLiveCommerceEvent(streamID string, eventType string, userID string) {
	// e.g. "product_clicked", "added_to_cart", "purchased"
	// This pipes into the Telemetry/Big Data system
}
