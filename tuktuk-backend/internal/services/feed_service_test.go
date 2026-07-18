package services

import (
	"context"
	"testing"
	"tuktuk-backend/internal/models"
	"tuktuk-backend/internal/repository"
)

func TestFeedService_GetPowerfulFeed_Goroutines(t *testing.T) {
	// Setup mock repo
	mockRepo := &repository.MockRepo{
		MockGetPosts: func(limit int, afterID string, provinceCode string) ([]models.Post, error) {
			return []models.Post{{ID: "post1", Content: "Hello"}}, nil
		},
		MockGetVerifiedNews: func(limit int) ([]models.News, error) {
			return []models.News{{ID: "news1", Title: "Breaking News"}}, nil
		},
		MockGetTrendingTags: func() ([]string, error) {
			return []string{"#mockTag"}, nil
		},
		MockGetUnreadNotifications: func(userID string) ([]models.Notification, error) {
			return []models.Notification{{ID: "notif1", Title: "Alert"}}, nil
		},
	}

	feedService := NewFeedService(mockRepo)

	ctx := context.Background()

	res, err := feedService.GetPowerfulFeed(ctx, "user1", "")
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	// Verify parallel fetching results
	if len(res.Posts) != 1 || res.Posts[0].ID != "post1" {
		t.Errorf("Posts were not fetched correctly")
	}
	if len(res.News) != 1 || res.News[0].ID != "news1" {
		t.Errorf("News was not fetched correctly")
	}
	if len(res.TrendingTags) != 1 || res.TrendingTags[0] != "#mockTag" {
		t.Errorf("Tags were not fetched correctly")
	}
	if len(res.Notifications) != 1 || res.Notifications[0].ID != "notif1" {
		t.Errorf("Notifications were not fetched correctly")
	}
}

func TestFeedService_RankPosts(t *testing.T) {
	mockRepo := &repository.MockRepo{}
	feedService := NewFeedService(mockRepo)

	ctx := context.Background()

	// Mock posts - will be sorted by interaction score (Likes/Views) when affinity is empty
	posts := []models.Post{
		{ID: "1", Likes: 10, ViewCount: 100},
		{ID: "2", Likes: 20, ViewCount: 200},
		{ID: "3", Likes: 50, ViewCount: 500},
	}

	sorted := feedService.rankPosts(ctx, "guest", posts)

	if len(sorted) != 3 {
		t.Fatalf("Expected 3 posts, got %d", len(sorted))
	}

	// Post 3 should have highest interaction score
	if sorted[0].ID != "3" {
		t.Errorf("Expected most relevant post at index 0, got %s", sorted[0].ID)
	}
}
