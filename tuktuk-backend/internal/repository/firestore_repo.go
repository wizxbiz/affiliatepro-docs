package repository

import (
	"context"
	"time"
	"tuktuk-backend/internal/models"

	"cloud.google.com/go/firestore"
)

type Repository interface {
	GetPosts(ctx context.Context, limit int) ([]models.Post, error)
	GetUnreadNotifications(ctx context.Context, userID string) ([]models.Notification, error)
	GetTrendingTags(ctx context.Context) ([]string, error)
	GetVerifiedNews(ctx context.Context, limit int) ([]models.News, error)
	GetTrendingPosts(ctx context.Context, limit int) ([]models.Post, error)
	GetMarketplaceProducts(ctx context.Context, limit int) ([]models.MarketplaceProduct, error)
	GetLeaderboard(ctx context.Context, limit int) ([]models.SellerLeaderboard, error)
	TogglePostLike(ctx context.Context, postID string, userID string) (bool, error)
	IncrementViewCount(ctx context.Context, postID string) error
	GetLiveSessions(ctx context.Context, limit int) ([]models.LiveSession, error)
	UpdateLiveHeadline(ctx context.Context, sessionID string, headlines []string) error
	StartLiveSession(ctx context.Context, session models.LiveSession) (string, error)
	EndLiveSession(ctx context.Context, sessionID string) error
	GetLiveSession(ctx context.Context, sessionID string) (*models.LiveSession, error)
	UpdateViewerCount(ctx context.Context, sessionID string, delta int) error
}

type firestoreRepo struct {
	client *firestore.Client
}

func NewFirestoreRepository(client *firestore.Client) Repository {
	return &firestoreRepo{client: client}
}

func (r *firestoreRepo) GetPosts(ctx context.Context, limit int) ([]models.Post, error) {
	if r.client == nil {
		return []models.Post{
			{ID: "1", Content: "TukTuk Go: Power of Goroutines! 🛺🔥", AuthorName: "System", Category: "Tech", CreatedAt: time.Now()},
			{ID: "2", Content: "Fast and lightweight backend with Gin.", AuthorName: "Go Ninja", Category: "News", CreatedAt: time.Now()},
		}, nil
	}

	docs, err := r.client.Collection("community_posts").
		OrderBy("createdAt", firestore.Desc).
		Limit(limit).
		Documents(ctx).GetAll()

	if err != nil {
		return nil, err
	}

	var posts []models.Post
	for _, doc := range docs {
		var p models.Post
		if err := doc.DataTo(&p); err == nil {
			p.ID = doc.Ref.ID
			posts = append(posts, p)
		}
	}
	return posts, nil
}

func (r *firestoreRepo) GetUnreadNotifications(ctx context.Context, userID string) ([]models.Notification, error) {
	if r.client == nil {
		return []models.Notification{
			{ID: "n1", Title: "Welcome!", Text: "You are running in Powerful Demo Mode.", Read: false, CreatedAt: time.Now()},
		}, nil
	}

	docs, err := r.client.Collection("notifications").
		Where("recipientId", "==", userID).
		Where("read", "==", false).
		OrderBy("createdAt", firestore.Desc).
		Limit(10).
		Documents(ctx).GetAll()

	if err != nil {
		return nil, err
	}

	var notify []models.Notification
	for _, doc := range docs {
		var n models.Notification
		if err := doc.DataTo(&n); err == nil {
			n.ID = doc.Ref.ID
			notify = append(notify, n)
		}
	}
	return notify, nil
}

func (r *firestoreRepo) GetTrendingTags(ctx context.Context) ([]string, error) {
	if r.client == nil {
		return []string{"#TukTuk", "#GoLang", "#Flutter"}, nil
	}
	// For now, return static popular tags or fetch from a 'stats' collection
	// In a real app, you'd aggregate these or store them in a dedicated doc
	return []string{"#Thailand", "#Travel", "#Food", "#MuayThai", "#SoftPower"}, nil
}

func (r *firestoreRepo) GetVerifiedNews(ctx context.Context, limit int) ([]models.News, error) {
	if r.client == nil {
		return []models.News{
			{ID: "n1", Title: "ข่าวสารแม่นยำ 100% จาก TukTuk Go", Summary: "เรารองรับการ Fact-Check ด้วย AI แล้ววันนี้", Source: "TukTuk News", IsVerified: true, CreatedAt: time.Now()},
		}, nil
	}

	docs, err := r.client.Collection("news_feed").
		Where("status", "==", "active").
		Where("isVerified", "==", true).
		OrderBy("createdAt", firestore.Desc).
		Limit(limit).
		Documents(ctx).GetAll()

	if err != nil {
		// Fallback to non-verified if no verified news yet
		docs, err = r.client.Collection("news_feed").
			Where("status", "==", "active").
			OrderBy("createdAt", firestore.Desc).
			Limit(limit).
			Documents(ctx).GetAll()
		if err != nil {
			return nil, err
		}
	}

	var news []models.News
	for _, doc := range docs {
		var n models.News
		if err := doc.DataTo(&n); err == nil {
			n.ID = doc.Ref.ID
			news = append(news, n)
		}
	}
	return news, nil
}

func (r *firestoreRepo) GetTrendingPosts(ctx context.Context, limit int) ([]models.Post, error) {
	if r.client == nil {
		return r.GetPosts(ctx, limit)
	}
	// Simple trending logic: Most viewed in last 24h (mocking time filter for now)
	var posts []models.Post
	docs, err := r.client.Collection("community_posts").
		OrderBy("viewCount", firestore.Desc).
		Limit(limit).
		Documents(ctx).GetAll()

	if err != nil {
		return nil, err
	}

	for _, doc := range docs {
		var p models.Post
		if err := doc.DataTo(&p); err == nil {
			p.ID = doc.Ref.ID
			posts = append(posts, p)
		}
	}
	return posts, nil
}

func (r *firestoreRepo) GetMarketplaceProducts(ctx context.Context, limit int) ([]models.MarketplaceProduct, error) {
	if r.client == nil {
		return []models.MarketplaceProduct{
			{ID: "demo1", ProductName: "สินค้าตัวอย่าง 1", Price: 299, Province: "เชียงใหม่", Category: "food", Status: "active"},
			{ID: "demo2", ProductName: "สินค้าตัวอย่าง 2", Price: 599, Province: "กรุงเทพมหานคร", Category: "craft", IsOtop: true, Status: "active"},
		}, nil
	}

	docs, err := r.client.Collection("marketplace_items").
		Where("status", "==", "active").
		OrderBy("createdAt", firestore.Desc).
		Limit(limit).
		Documents(ctx).GetAll()

	if err != nil {
		return nil, err
	}

	var products []models.MarketplaceProduct
	for _, doc := range docs {
		var p models.MarketplaceProduct
		if err := doc.DataTo(&p); err == nil {
			p.ID = doc.Ref.ID
			products = append(products, p)
		}
	}
	return products, nil
}

func (r *firestoreRepo) GetLeaderboard(ctx context.Context, limit int) ([]models.SellerLeaderboard, error) {
	if r.client == nil {
		return []models.SellerLeaderboard{
			{Rank: 1, ShopName: "ร้านแชมป์ยอดขาย", TotalSales: 120000, OrderCount: 350, Rating: 4.9, Province: "เชียงใหม่"},
			{Rank: 2, ShopName: "ร้านดาวรุ่ง", TotalSales: 85000, OrderCount: 210, Rating: 4.7, Province: "กรุงเทพมหานคร"},
		}, nil
	}

	docs, err := r.client.Collection("seller_profiles").
		Where("sellerStatus", "==", "active").
		OrderBy("totalSales", firestore.Desc).
		Limit(limit).
		Documents(ctx).GetAll()

	if err != nil {
		// Fallback: sellers without totalSales field (new sellers)
		docs, err = r.client.Collection("seller_profiles").
			Where("sellerStatus", "==", "active").
			OrderBy("orderCount", firestore.Desc).
			Limit(limit).
			Documents(ctx).GetAll()
		if err != nil {
			return nil, err
		}
	}

	var sellers []models.SellerLeaderboard
	for i, doc := range docs {
		var s models.SellerLeaderboard
		if err := doc.DataTo(&s); err == nil {
			s.SellerID = doc.Ref.ID
			s.Rank = i + 1
			sellers = append(sellers, s)
		}
	}
	return sellers, nil
}

func (r *firestoreRepo) TogglePostLike(ctx context.Context, postID string, userID string) (bool, error) {
	if r.client == nil {
		return true, nil
	}

	postRef := r.client.Collection("community_posts").Doc(postID)
	userLikeRef := r.client.Collection("user_likes").Doc(userID)

	var liked bool
	err := r.client.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		// Read user's liked posts to check status
		doc, err := tx.Get(userLikeRef)
		var likedIds []interface{}
		// If doc doesn't exist, likedIds remains empty
		if err == nil {
			if data := doc.Data(); data != nil {
				if ids, ok := data["likedPosts"].([]interface{}); ok {
					likedIds = ids
				}
			}
		}

		isLiked := false
		for _, id := range likedIds {
			if strID, ok := id.(string); ok && strID == postID {
				isLiked = true
				break
			}
		}

		if isLiked {
			// Unlike: Remove from array, decrement counter
			// Note: using Update here assumes doc exists, which it should if isLiked is true
			if err := tx.Update(postRef, []firestore.Update{{Path: "likes", Value: firestore.Increment(-1)}}); err != nil {
				return err
			}
			if err := tx.Update(userLikeRef, []firestore.Update{{Path: "likedPosts", Value: firestore.ArrayRemove(postID)}}); err != nil {
				return err
			}
			liked = false
		} else {
			// Like: Add to array, increment counter
			if err := tx.Update(postRef, []firestore.Update{{Path: "likes", Value: firestore.Increment(1)}}); err != nil {
				return err
			}
			// Use Set with MergeAll to create user_likes doc if it doesn't exist
			if err := tx.Set(userLikeRef, map[string]interface{}{
				"likedPosts": firestore.ArrayUnion(postID),
			}, firestore.MergeAll); err != nil {
				return err
			}
			liked = true
		}
		return nil
	})

	return liked, err
}

func (r *firestoreRepo) IncrementViewCount(ctx context.Context, postID string) error {
	if r.client == nil {
		return nil
	}
	_, err := r.client.Collection("community_posts").Doc(postID).Update(ctx, []firestore.Update{
		{Path: "viewCount", Value: firestore.Increment(1)},
	})
	return err
}

func (r *firestoreRepo) GetLiveSessions(ctx context.Context, limit int) ([]models.LiveSession, error) {
	if r.client == nil {
		return []models.LiveSession{
			{
				ID:          "live1",
				Title:       "ข่าวค่ำทันเหตุการณ์ (Official)",
				Description: "สรุปประเด็นข่าวร้อนทั่วไทย โดยสำนักข่าว TukTuk News",
				Thumbnail:   "https://images.unsplash.com/photo-1495020689067-958852a7765e",
				PlaybackURL: "https://d2q799pvhc99as.cloudfront.net/out/v1/d6871034c449419b88950d885a0344d2/index.m3u8",
				Broadcaster: models.LiveBroadcaster{
					AgencyName: "TukTuk News",
					IsOfficial: true,
					VerifyType: "news",
				},
				ViewerCount:      1250,
				Status:           "live",
				CurrentHeadlines: []string{"ระวังพายุเข้าพื้นที่ภาคเหนือ", "ดัชนีเศรษฐกิจไทยพุ่งสูงขึ้น"},
				CreatedAt:        time.Now(),
			},
		}, nil
	}

	docs, err := r.client.Collection("live_sessions").
		Where("status", "==", "live").
		OrderBy("createdAt", firestore.Desc).
		Limit(limit).
		Documents(ctx).GetAll()

	if err != nil {
		return nil, err
	}

	var sessions []models.LiveSession
	for _, doc := range docs {
		var s models.LiveSession
		if err := doc.DataTo(&s); err == nil {
			s.ID = doc.Ref.ID
			sessions = append(sessions, s)
		}
	}
	return sessions, nil
}

func (r *firestoreRepo) UpdateLiveHeadline(ctx context.Context, sessionID string, headlines []string) error {
	if r.client == nil {
		return nil
	}
	_, err := r.client.Collection("live_sessions").Doc(sessionID).Update(ctx, []firestore.Update{
		{Path: "headlines", Value: headlines},
		{Path: "updatedAt", Value: firestore.ServerTimestamp},
	})
	return err
}

func (r *firestoreRepo) StartLiveSession(ctx context.Context, session models.LiveSession) (string, error) {
	if r.client == nil {
		return "demo_session_id", nil
	}
	session.CreatedAt = time.Now()
	session.Status = "live"
	doc, _, err := r.client.Collection("live_sessions").Add(ctx, session)
	if err != nil {
		return "", err
	}
	return doc.ID, nil
}

func (r *firestoreRepo) EndLiveSession(ctx context.Context, sessionID string) error {
	if r.client == nil {
		return nil
	}
	_, err := r.client.Collection("live_sessions").Doc(sessionID).Update(ctx, []firestore.Update{
		{Path: "status", Value: "ended"},
		{Path: "endedAt", Value: firestore.ServerTimestamp},
	})
	return err
}

func (r *firestoreRepo) GetLiveSession(ctx context.Context, sessionID string) (*models.LiveSession, error) {
	if r.client == nil {
		return &models.LiveSession{ID: sessionID, Title: "Demo Session", ViewerCount: 99, Status: "live"}, nil
	}
	doc, err := r.client.Collection("live_sessions").Doc(sessionID).Get(ctx)
	if err != nil {
		return nil, err
	}
	var s models.LiveSession
	if err := doc.DataTo(&s); err != nil {
		return nil, err
	}
	s.ID = doc.Ref.ID
	return &s, nil
}

func (r *firestoreRepo) UpdateViewerCount(ctx context.Context, sessionID string, delta int) error {
	if r.client == nil {
		return nil
	}
	_, err := r.client.Collection("live_sessions").Doc(sessionID).Update(ctx, []firestore.Update{
		{Path: "viewerCount", Value: firestore.Increment(delta)},
	})
	return err
}
