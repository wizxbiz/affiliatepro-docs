package services

import (
	"context"
	"testing"
)

func TestAnalyticsService_GetSellerDashboardStats_MockData(t *testing.T) {
	// Passing nil sqlRepo to force mock fallback mode
	analyticsService := NewAnalyticsService(nil)

	ctx := context.Background()
	stats := analyticsService.GetSellerDashboardStats(ctx, "seller123")

	sellerID, ok := stats["sellerId"].(string)
	if !ok || sellerID != "seller123" {
		t.Errorf("Expected seller ID %s, got %v", "seller123", stats["sellerId"])
	}

	isReal, ok := stats["isRealData"].(bool)
	if !ok || isReal != false {
		t.Errorf("Expected isRealData false, got %v", stats["isRealData"])
	}
}

func TestAnalyticsService_GetCommunityInsights_NoSQL(t *testing.T) {
	analyticsService := NewAnalyticsService(nil)

	ctx := context.Background()
	insights := analyticsService.GetCommunityInsights(ctx, "เชียงใหม่")

	status, ok := insights["status"].(string)
	if !ok || status != "error" {
		t.Errorf("Expected status error, got %v", insights["status"])
	}
}
