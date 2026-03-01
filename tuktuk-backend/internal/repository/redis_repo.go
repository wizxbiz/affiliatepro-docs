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

func (r *redisRepo) GetPosts(ctx context.Context, limit int) ([]models.Post, error) {
	key := fmt.Sprintf("posts:limit:%d", limit)
	var posts []models.Post

	// Try cache first
	err := r.cache.Get(ctx, key, &posts)
	if err == nil {
		return posts, nil // Cache hit
	}

	// Cache miss, fetch from base
	posts, err = r.base.GetPosts(ctx, limit)
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

func (r *redisRepo) TogglePostLike(ctx context.Context, postID string, userID string) (bool, error) {
	return r.base.TogglePostLike(ctx, postID, userID)
}

func (r *redisRepo) IncrementViewCount(ctx context.Context, postID string) error {
	return r.base.IncrementViewCount(ctx, postID)
}
