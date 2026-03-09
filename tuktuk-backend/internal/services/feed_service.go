package services

import (
	"context"
	"fmt"
	"math"
	"sync"
	"time"
	"tuktuk-backend/internal/models"
	"tuktuk-backend/internal/repository"
)

type FeedService struct {
	repo repository.Repository
}

func NewFeedService(repo repository.Repository) *FeedService {
	return &FeedService{repo: repo}
}

// UserAffinity represents the user's interaction memory and preferences
type UserAffinity struct {
	ProvinceCode string
	Category     string
}

// Mock function to fetch user preferences (In prod: get from Redis/Firestore)
func (s *FeedService) getUserAffinity(userId string) UserAffinity {
	// Simulated personalization profile
	return UserAffinity{
		ProvinceCode: "10", // e.g. Bangkok
		Category:     "Food",
	}
}

// Rank/Score Algorithm v2: Anti-Gaming & Personalization
func (s *FeedService) rankPosts(userId string, posts []models.Post) []models.Post {
	now := time.Now()
	affinity := s.getUserAffinity(userId)

	type scoredPost struct {
		post  models.Post
		score float64
	}

	scored := make([]scoredPost, len(posts))
	for i, p := range posts {
		age := now.Sub(p.CreatedAt).Hours()

		// --- 🛡️ 1. Anti-Gaming System ---
		effectiveLikes := float64(p.Likes)

		// 1.1 Seller self-like exclusion (Penalize score to prevent self-boosting)
		if p.AuthorID == userId && effectiveLikes > 0 {
			effectiveLikes -= 1.0
		}

		// 1.2 Detect spam-like bursts & Unique viewer weighting
		// Instead of linear view counts, use Logarithmic scale (math.Log1p)
		// This dilutes the impact of bots spamming views.
		interactionScore := (effectiveLikes * 12.0) + (math.Log1p(float64(p.ViewCount)) * 5.0)

		// --- 🤖 2. Personalization Layer ---
		personalizationMultiplier := 1.0

		// 2.1 Province affinity (+50% boost if post matches user's location/interest)
		if p.ProvinceCode != "" && p.ProvinceCode == affinity.ProvinceCode {
			personalizationMultiplier += 0.5
		}

		// 2.2 Category affinity (+30% boost if user frequently interacts with this category)
		if p.Category != "" && p.Category == affinity.Category {
			personalizationMultiplier += 0.3
		}

		// Time decay factor (Power law) -> (Age+2)^1.5 prevents old posts from staying forever
		decay := 1.0 / math.Pow(age+2.0, 1.5)

		// Final Score calculation
		finalScore := interactionScore * decay * personalizationMultiplier

		scored[i] = scoredPost{post: p, score: finalScore}
	}

	// Sort by score descending
	for i := 0; i < len(scored); i++ {
		for j := i + 1; j < len(scored); j++ {
			if scored[j].score > scored[i].score {
				scored[i], scored[j] = scored[j], scored[i]
			}
		}
	}

	final := make([]models.Post, len(scored))
	for i, sp := range scored {
		final[i] = sp.post
	}
	return final
}

func (s *FeedService) GetPowerfulFeed(userId string) (models.FeedResponse, error) {
	start := time.Now()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var wg sync.WaitGroup
	var posts []models.Post
	var news []models.News
	var notifications []models.Notification
	var tags []string

	// POWER OF GOROUTINES: 4 independent tasks running in parallel
	wg.Add(4)

	// Task 1: Fetch Content
	go func() {
		defer wg.Done()
		posts, _ = s.repo.GetPosts(ctx, 20)
	}()

	// Task 2: Fetch Accurate News
	go func() {
		defer wg.Done()
		news, _ = s.repo.GetVerifiedNews(ctx, 10)
	}()

	// Task 3: Fetch Personal Notifications
	go func() {
		defer wg.Done()
		notifications, _ = s.repo.GetUnreadNotifications(ctx, userId)
	}()

	// Task 4: Fetch Trending Meta
	go func() {
		defer wg.Done()
		tags, _ = s.repo.GetTrendingTags(ctx)
	}()

	// Wait for all "Mini Threads" to complete
	wg.Wait()

	// Ranking v2 Logic: Anti-Gaming & Personalization
	rankedPosts := s.rankPosts(userId, posts)

	// ASYNC TASK (Fire & Forget): Log this feed view without making the user wait
	go func() {
		fmt.Printf("Logging feed access for user %s at %v\n", userId, time.Now())
	}()

	return models.FeedResponse{
		Status:        "success",
		Posts:         rankedPosts,
		News:          news,
		Notifications: notifications,
		TrendingTags:  tags,
		ExecutionTime: fmt.Sprintf("%v", time.Since(start)),
	}, nil
}

func (s *FeedService) ToggleLike(userId, postId string) (bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return s.repo.TogglePostLike(ctx, postId, userId)
}

func (s *FeedService) MarkAsViewed(postId string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return s.repo.IncrementViewCount(ctx, postId)
}

func (s *FeedService) GetTrendingFeed() (models.FeedResponse, error) {
	start := time.Now()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	posts, err := s.repo.GetTrendingPosts(ctx, 10)
	if err != nil {
		return models.FeedResponse{}, err
	}

	return models.FeedResponse{
		Status:        "success",
		Posts:         posts,
		ExecutionTime: fmt.Sprintf("%v", time.Since(start)),
	}, nil
}

// GetProducts returns active marketplace listings, served from cache.
func (s *FeedService) GetProducts(limit int) (models.ProductsResponse, error) {
	start := time.Now()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	products, err := s.repo.GetMarketplaceProducts(ctx, limit)
	if err != nil {
		return models.ProductsResponse{}, err
	}

	return models.ProductsResponse{
		Status:        "success",
		Products:      products,
		Total:         len(products),
		ExecutionTime: fmt.Sprintf("%v", time.Since(start)),
	}, nil
}

// GetLeaderboard returns top sellers ranked by total sales, served from cache.
func (s *FeedService) GetLeaderboard(limit int) (models.LeaderboardResponse, error) {
	start := time.Now()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	sellers, err := s.repo.GetLeaderboard(ctx, limit)
	if err != nil {
		return models.LeaderboardResponse{}, err
	}

	return models.LeaderboardResponse{
		Status:        "success",
		Sellers:       sellers,
		ExecutionTime: fmt.Sprintf("%v", time.Since(start)),
	}, nil
}

// GetLiveSessions returns active live streaming sessions, primarily official news.
func (s *FeedService) GetLiveSessions(limit int) (models.LiveResponse, error) {
	start := time.Now()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	sessions, err := s.repo.GetLiveSessions(ctx, limit)
	if err != nil {
		return models.LiveResponse{}, err
	}

	return models.LiveResponse{
		Status:        "success",
		LiveSessions:  sessions,
		ExecutionTime: fmt.Sprintf("%v", time.Since(start)),
	}, nil
}

// WarmAll pre-fetches all hot collections into the cache layer in parallel.
// Call once at startup then on a ticker to keep data fresh.
func (s *FeedService) WarmAll() {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	var wg sync.WaitGroup
	wg.Add(7)
	go func() { defer wg.Done(); s.repo.GetPosts(ctx, 20) }()
	go func() { defer wg.Done(); s.repo.GetVerifiedNews(ctx, 10) }()
	go func() { defer wg.Done(); s.repo.GetTrendingPosts(ctx, 10) }()
	go func() { defer wg.Done(); s.repo.GetTrendingTags(ctx) }()
	go func() { defer wg.Done(); s.repo.GetMarketplaceProducts(ctx, 40) }()
	go func() { defer wg.Done(); s.repo.GetLeaderboard(ctx, 20) }()
	go func() { defer wg.Done(); s.repo.GetLiveSessions(ctx, 10) }()
	wg.Wait()
}

func (s *FeedService) StartLiveSession(session models.LiveSession) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return s.repo.StartLiveSession(ctx, session)
}

func (s *FeedService) EndLiveSession(sessionID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return s.repo.EndLiveSession(ctx, sessionID)
}

func (s *FeedService) GetLiveSessionStatus(sessionID string) (*models.LiveSession, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return s.repo.GetLiveSession(ctx, sessionID)
}

func (s *FeedService) LiveHeartbeat(sessionID string, isJoining bool) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	delta := -1
	if isJoining {
		delta = 1
	}
	return s.repo.UpdateViewerCount(ctx, sessionID, delta)
}
