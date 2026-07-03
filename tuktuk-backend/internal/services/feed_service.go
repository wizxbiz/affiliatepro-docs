package services

import (
	"context"
	"fmt"
	"math"
	"sort"
	"sync"
	"time"
	"tuktuk-backend/internal/models"
	"tuktuk-backend/internal/repository"

	"cloud.google.com/go/firestore"
)

type FeedService struct {
	repo     repository.Repository
	fsClient *firestore.Client // for affinity lookups
}

func NewFeedService(repo repository.Repository) *FeedService {
	return &FeedService{repo: repo}
}

// SetFirestoreClient injects the Firestore client for affinity lookups.
// Call this after NewFeedService when a real Firestore client is available.
func (s *FeedService) SetFirestoreClient(client *firestore.Client) {
	s.fsClient = client
}

// UserAffinity represents the user's interaction memory and preferences
type UserAffinity struct {
	ProvinceCode string
	Category     string
}

// getUserAffinity fetches personalization profile from either D1 or Firestore repo.
// Falls back to neutral defaults if user doc is missing.
func (s *FeedService) getUserAffinity(ctx context.Context, userId string) UserAffinity {
	if userId == "guest" || userId == "" {
		return UserAffinity{ProvinceCode: "", Category: ""}
	}

	province, category, err := s.repo.GetUserAffinity(ctx, userId)
	if err != nil {
		return UserAffinity{ProvinceCode: "", Category: ""}
	}

	return UserAffinity{
		ProvinceCode: province,
		Category:     category,
	}
}

// rankPosts: Anti-Gaming & Personalization — O(n log n) with sort.Slice
func (s *FeedService) rankPosts(ctx context.Context, userId string, posts []models.Post) []models.Post {
	now := time.Now()
	affinity := s.getUserAffinity(ctx, userId)

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

		// 1.2 Log scale for views (dilutes bot-spam)
		interactionScore := (effectiveLikes * 12.0) + (math.Log1p(float64(p.ViewCount)) * 5.0)

		// --- 🤖 2. Personalization Layer ---
		personalizationMultiplier := 1.0

		// 2.1 Province affinity (+50%)
		if affinity.ProvinceCode != "" && p.ProvinceCode == affinity.ProvinceCode {
			personalizationMultiplier += 0.5
		}

		// 2.2 Category affinity (+30%)
		if affinity.Category != "" && p.Category == affinity.Category {
			personalizationMultiplier += 0.3
		}

		// Time decay factor (Power law)
		decay := 1.0 / math.Pow(age+2.0, 1.5)

		scored[i] = scoredPost{post: p, score: interactionScore * decay * personalizationMultiplier}
	}

	// ✅ FIX: sort.Slice O(n log n) instead of Bubble Sort O(n²)
	sort.Slice(scored, func(i, j int) bool {
		return scored[i].score > scored[j].score
	})

	final := make([]models.Post, len(scored))
	for i, sp := range scored {
		final[i] = sp.post
	}
	return final
}

func (s *FeedService) GetPowerfulFeed(ctx context.Context, userId string, provinceCode string) (models.FeedResponse, error) {
	start := time.Now()
	fetchCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var wg sync.WaitGroup
	var posts []models.Post
	var news []models.News
	var notifications []models.Notification
	var tags []string

	// POWER OF GOROUTINES: 4 independent tasks running in parallel
	wg.Add(4)

	go func() { defer wg.Done(); posts, _ = s.repo.GetPosts(fetchCtx, 20, "", provinceCode) }()
	go func() { defer wg.Done(); news, _ = s.repo.GetVerifiedNews(fetchCtx, 10) }()
	go func() { defer wg.Done(); notifications, _ = s.repo.GetUnreadNotifications(fetchCtx, userId) }()
	go func() { defer wg.Done(); tags, _ = s.repo.GetTrendingTags(fetchCtx) }()

	wg.Wait()

	// Ranking v2: Anti-Gaming & Real Personalization
	rankedPosts := s.rankPosts(ctx, userId, posts)

	// Fire & forget: async feed view logging
	go func() {
		fmt.Printf("[Feed] user=%s posts=%d time=%v\n", userId, len(rankedPosts), time.Now())
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
func (s *FeedService) GetProducts(limit int, afterID string, provinceCode string) (models.ProductsResponse, error) {
	start := time.Now()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	products, err := s.repo.GetMarketplaceProducts(ctx, limit, afterID, provinceCode)
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

// GetLiveSessions returns active live streaming sessions.
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

// WarmAll pre-fetches all hot collections into cache in parallel.
// Bounded concurrency (semaphore=3) to avoid Firestore quota throttling.
func (s *FeedService) WarmAll() {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	type warmTask func()
	tasks := []warmTask{
		func() { s.repo.GetPosts(ctx, 20, "", "") },
		func() { s.repo.GetVerifiedNews(ctx, 10) },
		func() { s.repo.GetTrendingPosts(ctx, 10) },
		func() { s.repo.GetTrendingTags(ctx) },
		func() { s.repo.GetMarketplaceProducts(ctx, 40, "", "") },
		func() { s.repo.GetLeaderboard(ctx, 20) },
		func() { s.repo.GetLiveSessions(ctx, 10) },
	}

	// ✅ FIX: Semaphore (max 3 parallel) prevents Firestore quota throttling
	sem := make(chan struct{}, 3)
	var wg sync.WaitGroup
	wg.Add(len(tasks))

	for _, task := range tasks {
		t := task
		go func() {
			sem <- struct{}{}
			defer func() {
				<-sem
				wg.Done()
			}()
			t()
		}()
	}
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

// ── Core Content Methods ────────────────────────────────────────────────────

func (s *FeedService) GetPost(postID string) (*models.Post, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return s.repo.GetPost(ctx, postID)
}

func (s *FeedService) CreatePost(post *models.Post) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return s.repo.CreatePost(ctx, post)
}

func (s *FeedService) GetComments(postID string, limit int, afterID string) ([]models.Comment, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return s.repo.GetComments(ctx, postID, limit, afterID)
}

func (s *FeedService) CreateComment(comment *models.Comment) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return s.repo.CreateComment(ctx, comment)
}

func (s *FeedService) GetUserProfileParams(ctx context.Context, userID string) (models.UserProfile, []models.Post, error) {
	fetchCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var wg sync.WaitGroup
	var posts []models.Post

	wg.Add(1)
	go func() { defer wg.Done(); posts, _ = s.repo.GetUserPosts(fetchCtx, userID, 20) }()
	wg.Wait()

	// Create basic mocked profile - ideally fetch from firebase auth or line_users
	profile := models.UserProfile{
		UID:         userID,
		DisplayName: "User " + userID[:min(len(userID), 5)],
		Bio:         "Welcome to my TukTuk Profile! 🛺",
		Followers:   42,
	}

	return profile, posts, nil
}

func (s *FeedService) SearchPosts(query string, limit int) ([]models.Post, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return s.repo.SearchPosts(ctx, query, limit)
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
