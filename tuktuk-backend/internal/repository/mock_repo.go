package repository

import (
	"context"
	"tuktuk-backend/internal/models"
)

// MockRepo is a mocked implementation of repository.Repository for testing.
type MockRepo struct {
	MockGetPosts               func(limit int, afterID string, provinceCode string) ([]models.Post, error)
	MockGetUnreadNotifications func(userID string) ([]models.Notification, error)
	MockGetTrendingTags        func() ([]string, error)
	MockGetVerifiedNews        func(limit int) ([]models.News, error)
	MockGetTrendingPosts       func(limit int) ([]models.Post, error)
	MockGetMarketplaceProducts func(limit int, afterID string, provinceCode string) ([]models.MarketplaceProduct, error)
	MockGetLeaderboard         func(limit int) ([]models.SellerLeaderboard, error)
	MockTogglePostLike         func(postID string, userID string) (bool, error)
	MockIncrementViewCount     func(postID string) error
	MockGetLiveSessions        func(limit int) ([]models.LiveSession, error)
	MockUpdateLiveHeadline     func(sessionID string, headlines []string) error
	MockStartLiveSession       func(session models.LiveSession) (string, error)
	MockEndLiveSession         func(sessionID string) error
	MockGetLiveSession         func(sessionID string) (*models.LiveSession, error)
	MockUpdateViewerCount      func(sessionID string, delta int) error
	MockGetPost                func(postID string) (*models.Post, error)
	MockCreatePost             func(post *models.Post) error
	MockGetComments            func(postID string, limit int, afterID string) ([]models.Comment, error)
	MockCreateComment          func(comment *models.Comment) error
	MockGetUserPosts           func(userID string, limit int) ([]models.Post, error)
	MockSearchPosts            func(query string, limit int) ([]models.Post, error)
}

func (m *MockRepo) GetPosts(ctx context.Context, limit int, afterID string, provinceCode string) ([]models.Post, error) {
	if m.MockGetPosts != nil {
		return m.MockGetPosts(limit, afterID, provinceCode)
	}
	return []models.Post{}, nil
}

func (m *MockRepo) GetUnreadNotifications(ctx context.Context, userID string) ([]models.Notification, error) {
	if m.MockGetUnreadNotifications != nil {
		return m.MockGetUnreadNotifications(userID)
	}
	return []models.Notification{}, nil
}

func (m *MockRepo) GetTrendingTags(ctx context.Context) ([]string, error) {
	if m.MockGetTrendingTags != nil {
		return m.MockGetTrendingTags()
	}
	return []string{"#mock"}, nil
}

func (m *MockRepo) GetVerifiedNews(ctx context.Context, limit int) ([]models.News, error) {
	if m.MockGetVerifiedNews != nil {
		return m.MockGetVerifiedNews(limit)
	}
	return []models.News{}, nil
}

func (m *MockRepo) GetTrendingPosts(ctx context.Context, limit int) ([]models.Post, error) {
	if m.MockGetTrendingPosts != nil {
		return m.MockGetTrendingPosts(limit)
	}
	return []models.Post{}, nil
}

func (m *MockRepo) GetMarketplaceProducts(ctx context.Context, limit int, afterID string, provinceCode string) ([]models.MarketplaceProduct, error) {
	if m.MockGetMarketplaceProducts != nil {
		return m.MockGetMarketplaceProducts(limit, afterID, provinceCode)
	}
	return []models.MarketplaceProduct{}, nil
}

func (m *MockRepo) GetLeaderboard(ctx context.Context, limit int) ([]models.SellerLeaderboard, error) {
	if m.MockGetLeaderboard != nil {
		return m.MockGetLeaderboard(limit)
	}
	return []models.SellerLeaderboard{}, nil
}

func (m *MockRepo) TogglePostLike(ctx context.Context, postID string, userID string) (bool, error) {
	if m.MockTogglePostLike != nil {
		return m.MockTogglePostLike(postID, userID)
	}
	return true, nil
}

func (m *MockRepo) IncrementViewCount(ctx context.Context, postID string) error {
	if m.MockIncrementViewCount != nil {
		return m.MockIncrementViewCount(postID)
	}
	return nil
}

func (m *MockRepo) GetLiveSessions(ctx context.Context, limit int) ([]models.LiveSession, error) {
	if m.MockGetLiveSessions != nil {
		return m.MockGetLiveSessions(limit)
	}
	return []models.LiveSession{}, nil
}

func (m *MockRepo) UpdateLiveHeadline(ctx context.Context, sessionID string, headlines []string) error {
	if m.MockUpdateLiveHeadline != nil {
		return m.MockUpdateLiveHeadline(sessionID, headlines)
	}
	return nil
}

func (m *MockRepo) StartLiveSession(ctx context.Context, session models.LiveSession) (string, error) {
	if m.MockStartLiveSession != nil {
		return m.MockStartLiveSession(session)
	}
	return "mock-session-id", nil
}

func (m *MockRepo) EndLiveSession(ctx context.Context, sessionID string) error {
	if m.MockEndLiveSession != nil {
		return m.MockEndLiveSession(sessionID)
	}
	return nil
}

func (m *MockRepo) GetLiveSession(ctx context.Context, sessionID string) (*models.LiveSession, error) {
	if m.MockGetLiveSession != nil {
		return m.MockGetLiveSession(sessionID)
	}
	return &models.LiveSession{}, nil
}

func (m *MockRepo) UpdateViewerCount(ctx context.Context, sessionID string, delta int) error {
	if m.MockUpdateViewerCount != nil {
		return m.MockUpdateViewerCount(sessionID, delta)
	}
	return nil
}

func (m *MockRepo) GetPost(ctx context.Context, postID string) (*models.Post, error) {
	if m.MockGetPost != nil {
		return m.MockGetPost(postID)
	}
	return &models.Post{}, nil
}

func (m *MockRepo) CreatePost(ctx context.Context, post *models.Post) error {
	if m.MockCreatePost != nil {
		return m.MockCreatePost(post)
	}
	return nil
}

func (m *MockRepo) GetComments(ctx context.Context, postID string, limit int, afterID string) ([]models.Comment, error) {
	if m.MockGetComments != nil {
		return m.MockGetComments(postID, limit, afterID)
	}
	return []models.Comment{}, nil
}

func (m *MockRepo) CreateComment(ctx context.Context, comment *models.Comment) error {
	if m.MockCreateComment != nil {
		return m.MockCreateComment(comment)
	}
	return nil
}

func (m *MockRepo) GetUserPosts(ctx context.Context, userID string, limit int) ([]models.Post, error) {
	if m.MockGetUserPosts != nil {
		return m.MockGetUserPosts(userID, limit)
	}
	return []models.Post{}, nil
}

func (m *MockRepo) SearchPosts(ctx context.Context, query string, limit int) ([]models.Post, error) {
	if m.MockSearchPosts != nil {
		return m.MockSearchPosts(query, limit)
	}
	return []models.Post{}, nil
}
