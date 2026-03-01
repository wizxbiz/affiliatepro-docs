package services

import (
	"math/rand"
	"time"

	"github.com/gin-gonic/gin"
)

// AnalyticsService handles Big Data queries for the Seller Dashboard
type AnalyticsService struct{}

func NewAnalyticsService() *AnalyticsService {
	return &AnalyticsService{}
}

// GetSellerDashboardStats returns mocked big data analytics for a seller
func (s *AnalyticsService) GetSellerDashboardStats(sellerID string) gin.H {
	// In a real V.4 system, this would query Google BigQuery or a materialized view in PostgreSQL/Firestore

	// Mocking advanced analytics data
	salesToday := rand.Intn(10000) + 500
	salesWeek := salesToday * (rand.Intn(5) + 3)

	trendingProducts := []gin.H{
		{"id": "p1", "name": "หมอนขวิดสาน OTOP", "views": rand.Intn(5000) + 1000, "conversionRate": 4.5},
		{"id": "p2", "name": "น้ำพริกหนุ่มแม่อุ๊ย", "views": rand.Intn(4000) + 500, "conversionRate": 8.2},
		{"id": "p3", "name": "เสื้อคอกระเช้าประยุกต์", "views": rand.Intn(3000) + 200, "conversionRate": 3.1},
	}

	demandHeatmap := []gin.H{
		{"time": "08:00", "demandLevel": "High", "area": "ตัวเมือง"},
		{"time": "12:00", "demandLevel": "Peak", "area": "ย่านออฟฟิศ"},
		{"time": "18:00", "demandLevel": "Peak", "area": "ตลาดโต้รุ่ง"},
	}

	return gin.H{
		"sellerId":  sellerID,
		"timestamp": time.Now().Format(time.RFC3339),
		"metrics": gin.H{
			"salesToday":    salesToday,
			"salesWeek":     salesWeek,
			"growthPercent": rand.Intn(30) + 5,
		},
		"trendingProducts": trendingProducts,
		"demandHeatmap":    demandHeatmap,
	}
}

// LogLiveCommerceEvent registers interactions during a live stream
func (s *AnalyticsService) LogLiveCommerceEvent(streamID string, eventType string, userID string) {
	// e.g. "product_clicked", "added_to_cart", "purchased"
	// This pipes into the Telemetry/Big Data system
}
