package repository

import (
	"context"
	"fmt"
	"time"
	"tuktuk-backend/internal/cache"
	"tuktuk-backend/internal/models"
)

// redisRepo wraps a Repository and adds caching.
type redisRepo struct {
	base  Repository
	cache cache.CacheService
}

// NewRedisRepository creates a new Repository that uses Redis for caching.
func NewRedisRepository(base Repository, cache cache.CacheService) Repository {
	return &redisRepo{
		base:  base,
		cache: cache,
	}
}

func (r *redisRepo) GetPosts(ctx context.Context, limit int, afterID string, provinceCode string) ([]models.Post, error) {
	if afterID != "" {
		return r.base.GetPosts(ctx, limit, afterID, provinceCode)
	}

	key := fmt.Sprintf("posts:limit:%d:prov:%s", limit, provinceCode)
	var posts []models.Post

	// Try cache first
	err := r.cache.Get(ctx, key, &posts)
	if err == nil {
		return posts, nil // Cache hit
	}

	// Cache miss, fetch from base
	posts, err = r.base.GetPosts(ctx, limit, afterID, provinceCode)
	if err != nil {
		return nil, err
	}

	// Set cache
	_ = r.cache.Set(ctx, key, posts, 5*time.Minute)

	return posts, nil
}

func (r *redisRepo) GetUnreadNotifications(ctx context.Context, userID string) ([]models.Notification, error) {
	key := fmt.Sprintf("notifications:user:%s", userID)
	var notifications []models.Notification

	if err := r.cache.Get(ctx, key, &notifications); err == nil {
		return notifications, nil
	}

	notifications, err := r.base.GetUnreadNotifications(ctx, userID)
	if err != nil {
		return nil, err
	}

	_ = r.cache.Set(ctx, key, notifications, 30*time.Second)

	return notifications, nil
}

func (r *redisRepo) GetTrendingTags(ctx context.Context) ([]string, error) {
	key := "trending_tags"
	var tags []string

	if err := r.cache.Get(ctx, key, &tags); err == nil {
		return tags, nil
	}

	tags, err := r.base.GetTrendingTags(ctx)
	if err != nil {
		return nil, err
	}

	_ = r.cache.Set(ctx, key, tags, 1*time.Hour)

	return tags, nil
}

func (r *redisRepo) GetVerifiedNews(ctx context.Context, limit int) ([]models.News, error) {
	key := fmt.Sprintf("verified_news:limit:%d", limit)
	var news []models.News

	if err := r.cache.Get(ctx, key, &news); err == nil {
		return news, nil
	}

	news, err := r.base.GetVerifiedNews(ctx, limit)
	if err != nil {
		return nil, err
	}

	_ = r.cache.Set(ctx, key, news, 15*time.Minute)

	return news, nil
}

func (r *redisRepo) GetTrendingPosts(ctx context.Context, limit int) ([]models.Post, error) {
	key := fmt.Sprintf("trending_posts:limit:%d", limit)
	var posts []models.Post

	if err := r.cache.Get(ctx, key, &posts); err == nil {
		return posts, nil
	}

	posts, err := r.base.GetTrendingPosts(ctx, limit)
	if err != nil {
		return nil, err
	}

	_ = r.cache.Set(ctx, key, posts, 10*time.Minute)

	return posts, nil
}

func (r *redisRepo) GetMarketplaceProducts(ctx context.Context, limit int, afterID string, provinceCode string) ([]models.MarketplaceProduct, error) {
	if afterID != "" {
		return r.base.GetMarketplaceProducts(ctx, limit, afterID, provinceCode)
	}

	key := fmt.Sprintf("marketplace_products:limit:%d:prov:%s", limit, provinceCode)
	var products []models.MarketplaceProduct

	if err := r.cache.Get(ctx, key, &products); err == nil {
		return products, nil
	}

	products, err := r.base.GetMarketplaceProducts(ctx, limit, afterID, provinceCode)
	if err != nil {
		return nil, err
	}

	_ = r.cache.Set(ctx, key, products, 5*time.Minute)
	return products, nil
}

func (r *redisRepo) GetLeaderboard(ctx context.Context, limit int) ([]models.SellerLeaderboard, error) {
	key := fmt.Sprintf("leaderboard:limit:%d", limit)
	var sellers []models.SellerLeaderboard

	if err := r.cache.Get(ctx, key, &sellers); err == nil {
		return sellers, nil
	}

	sellers, err := r.base.GetLeaderboard(ctx, limit)
	if err != nil {
		return nil, err
	}

	_ = r.cache.Set(ctx, key, sellers, 10*time.Minute)
	return sellers, nil
}

func (r *redisRepo) TogglePostLike(ctx context.Context, postID string, userID string) (bool, error) {
	// Invalidate post caches so ranking updates
	_ = r.cache.Delete(ctx, "posts:limit:20")
	_ = r.cache.Delete(ctx, "trending_posts:limit:10")
	return r.base.TogglePostLike(ctx, postID, userID)
}

func (r *redisRepo) IncrementViewCount(ctx context.Context, postID string) error {
	// Invalidate post caches
	_ = r.cache.Delete(ctx, "posts:limit:20")
	_ = r.cache.Delete(ctx, "trending_posts:limit:10")
	return r.base.IncrementViewCount(ctx, postID)
}

func (r *redisRepo) GetLiveSessions(ctx context.Context, limit int) ([]models.LiveSession, error) {
	key := fmt.Sprintf("live_sessions:limit:%d", limit)
	var sessions []models.LiveSession

	if err := r.cache.Get(ctx, key, &sessions); err == nil {
		return sessions, nil
	}

	sessions, err := r.base.GetLiveSessions(ctx, limit)
	if err != nil {
		return nil, err
	}

	_ = r.cache.Set(ctx, key, sessions, 1*time.Minute)
	return sessions, nil
}

func (r *redisRepo) UpdateLiveHeadline(ctx context.Context, sessionID string, headlines []string) error {
	_ = r.cache.Delete(ctx, "live_sessions:limit:10")
	_ = r.cache.Delete(ctx, "live_sessions:limit:30")
	return r.base.UpdateLiveHeadline(ctx, sessionID, headlines)
}

func (r *redisRepo) StartLiveSession(ctx context.Context, session models.LiveSession) (string, error) {
	_ = r.cache.Delete(ctx, "live_sessions:limit:10")
	_ = r.cache.Delete(ctx, "live_sessions:limit:30")
	return r.base.StartLiveSession(ctx, session)
}

func (r *redisRepo) EndLiveSession(ctx context.Context, sessionID string) error {
	_ = r.cache.Delete(ctx, "live_sessions:limit:10")
	_ = r.cache.Delete(ctx, "live_sessions:limit:30")
	return r.base.EndLiveSession(ctx, sessionID)
}

func (r *redisRepo) GetLiveSession(ctx context.Context, sessionID string) (*models.LiveSession, error) {
	key := fmt.Sprintf("live_session:%s", sessionID)
	var session models.LiveSession

	if err := r.cache.Get(ctx, key, &session); err == nil {
		return &session, nil
	}

	res, err := r.base.GetLiveSession(ctx, sessionID)
	if err != nil {
		return nil, err
	}

	_ = r.cache.Set(ctx, key, res, 10*time.Second) // Short cache for status
	return res, nil
}

func (r *redisRepo) UpdateViewerCount(ctx context.Context, sessionID string, delta int) error {
	// Invalidate cache for this session and the list
	_ = r.cache.Delete(ctx, fmt.Sprintf("live_session:%s", sessionID))
	_ = r.cache.Delete(ctx, "live_sessions:limit:10")
	_ = r.cache.Delete(ctx, "live_sessions:limit:30")
	return r.base.UpdateViewerCount(ctx, sessionID, delta)
}

// ── Core Content APIs ───────────────────────────────────────────────────────

func (r *redisRepo) GetPost(ctx context.Context, postID string) (*models.Post, error) {
	key := fmt.Sprintf("post:%s", postID)
	var post models.Post

	if err := r.cache.Get(ctx, key, &post); err == nil {
		return &post, nil
	}

	res, err := r.base.GetPost(ctx, postID)
	if err != nil {
		return nil, err
	}

	_ = r.cache.Set(ctx, key, res, 2*time.Minute)
	return res, nil
}

func (r *redisRepo) CreatePost(ctx context.Context, post *models.Post) error {
	// Invalidate relevant caches
	_ = r.cache.Delete(ctx, "posts:limit:20")
	_ = r.cache.Delete(ctx, fmt.Sprintf("user_posts:%s", post.AuthorID))
	return r.base.CreatePost(ctx, post)
}

func (r *redisRepo) GetComments(ctx context.Context, postID string, limit int, afterID string) ([]models.Comment, error) {
	if afterID != "" {
		return r.base.GetComments(ctx, postID, limit, afterID)
	}

	key := fmt.Sprintf("comments:%s:%d", postID, limit)
	var comments []models.Comment

	if err := r.cache.Get(ctx, key, &comments); err == nil {
		return comments, nil
	}

	comments, err := r.base.GetComments(ctx, postID, limit, afterID)
	if err != nil {
		return nil, err
	}

	_ = r.cache.Set(ctx, key, comments, 1*time.Minute)
	return comments, nil
}

func (r *redisRepo) CreateComment(ctx context.Context, comment *models.Comment) error {
	_ = r.cache.Delete(ctx, fmt.Sprintf("post:%s", comment.PostID))
	_ = r.cache.Delete(ctx, fmt.Sprintf("comments:%s:10", comment.PostID))
	_ = r.cache.Delete(ctx, fmt.Sprintf("comments:%s:20", comment.PostID))
	return r.base.CreateComment(ctx, comment)
}

func (r *redisRepo) GetUserPosts(ctx context.Context, userID string, limit int) ([]models.Post, error) {
	key := fmt.Sprintf("user_posts:%s:%d", userID, limit)
	var posts []models.Post

	if err := r.cache.Get(ctx, key, &posts); err == nil {
		return posts, nil
	}

	posts, err := r.base.GetUserPosts(ctx, userID, limit)
	if err != nil {
		return nil, err
	}

	_ = r.cache.Set(ctx, key, posts, 5*time.Minute)
	return posts, nil
}

func (r *redisRepo) SearchPosts(ctx context.Context, query string, limit int) ([]models.Post, error) {
	// Don't cache search queries aggressively unless they are very common
	return r.base.SearchPosts(ctx, query, limit)
}

func (r *redisRepo) GetUserAffinity(ctx context.Context, userID string) (string, string, error) {
	return r.base.GetUserAffinity(ctx, userID)
}
