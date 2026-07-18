package repository

import (
	"context"
	"log"
	"sort"
	"sync"
	"time"
	"tuktuk-backend/internal/models"

	"cloud.google.com/go/firestore"
)

type Repository interface {
	GetPosts(ctx context.Context, limit int, afterID string, provinceCode string) ([]models.Post, error)
	GetUnreadNotifications(ctx context.Context, userID string) ([]models.Notification, error)
	GetTrendingTags(ctx context.Context) ([]string, error)
	GetVerifiedNews(ctx context.Context, limit int) ([]models.News, error)
	GetTrendingPosts(ctx context.Context, limit int) ([]models.Post, error)
	GetMarketplaceProducts(ctx context.Context, limit int, afterID string, provinceCode string) ([]models.MarketplaceProduct, error)
	GetLeaderboard(ctx context.Context, limit int) ([]models.SellerLeaderboard, error)
	TogglePostLike(ctx context.Context, postID string, userID string) (bool, error)
	IncrementViewCount(ctx context.Context, postID string) error
	GetLiveSessions(ctx context.Context, limit int) ([]models.LiveSession, error)
	UpdateLiveHeadline(ctx context.Context, sessionID string, headlines []string) error
	StartLiveSession(ctx context.Context, session models.LiveSession) (string, error)
	EndLiveSession(ctx context.Context, sessionID string) error
	GetLiveSession(ctx context.Context, sessionID string) (*models.LiveSession, error)
	UpdateViewerCount(ctx context.Context, sessionID string, delta int) error

	// ── Core Content APIs ──
	GetPost(ctx context.Context, postID string) (*models.Post, error)
	CreatePost(ctx context.Context, post *models.Post) error
	GetComments(ctx context.Context, postID string, limit int, afterID string) ([]models.Comment, error)
	CreateComment(ctx context.Context, comment *models.Comment) error
	GetUserPosts(ctx context.Context, userID string, limit int) ([]models.Post, error)
	SearchPosts(ctx context.Context, query string, limit int) ([]models.Post, error)
	GetUserAffinity(ctx context.Context, userID string) (string, string, error)
}

type firestoreRepo struct {
	client     *firestore.Client
	viewBuffer map[string]int
	viewMutex  sync.Mutex
}

func NewFirestoreRepository(client *firestore.Client) Repository {
	repo := &firestoreRepo{
		client:     client,
		viewBuffer: make(map[string]int),
	}

	if client != nil {
		go repo.flushViewCountsLoop()
	}

	return repo
}

func (r *firestoreRepo) flushViewCountsLoop() {
	ticker := time.NewTicker(20 * time.Second) // Flush every 20 seconds
	defer ticker.Stop()
	for range ticker.C {
		r.viewMutex.Lock()
		if len(r.viewBuffer) == 0 {
			r.viewMutex.Unlock()
			continue
		}
		// Copy buffer and reset
		countsToFlush := r.viewBuffer
		r.viewBuffer = make(map[string]int)
		r.viewMutex.Unlock()

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)

		var wg sync.WaitGroup
		for postID, count := range countsToFlush {
			wg.Add(1)
			go func(pID string, c int) {
				defer wg.Done()
				_, err := r.client.Collection("community_posts").Doc(pID).Update(ctx, []firestore.Update{
					{Path: "viewCount", Value: firestore.Increment(c)},
				})
				if err != nil {
					log.Printf("Failed to flush view count for post %s: %v", pID, err)
				}
			}(postID, count)
		}

		wg.Wait()
		cancel()
	}
}

func (r *firestoreRepo) GetPosts(ctx context.Context, limit int, afterID string, provinceCode string) ([]models.Post, error) {
	if r.client == nil {
		return []models.Post{
			{ID: "1", Content: "TukTuk Go: Power of Goroutines! 🛺🔥", AuthorName: "System", Category: "Tech", CreatedAt: time.Now()},
			{ID: "2", Content: "Fast and lightweight backend with Gin.", AuthorName: "Go Ninja", Category: "News", CreatedAt: time.Now()},
		}, nil
	}

	q := r.client.Collection("community_posts").OrderBy("createdAt", firestore.Desc)
	if provinceCode != "" {
		q = r.client.Collection("community_posts").
			Where("provinceCode", "==", provinceCode).
			OrderBy("createdAt", firestore.Desc)
	}

	if afterID != "" {
		docRef, err := r.client.Collection("community_posts").Doc(afterID).Get(ctx)
		if err == nil {
			q = q.StartAfter(docRef)
		}
	}

	docs, err := q.Limit(limit).Documents(ctx).GetAll()

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
	defaultTags := []string{"#Thailand", "#Travel", "#Food", "#MuayThai", "#SoftPower", "#OTOP", "#TukTuk"}
	if r.client == nil {
		return defaultTags, nil
	}
	// Try fetching from dedicated trending_tags collection (populated by Cloud Functions)
	doc, err := r.client.Collection("trending_tags").Doc("current").Get(ctx)
	if err == nil {
		if data := doc.Data(); data != nil {
			if raw, ok := data["tags"].([]interface{}); ok {
				tags := make([]string, 0, len(raw))
				for _, t := range raw {
					if s, ok := t.(string); ok {
						tags = append(tags, s)
					}
				}
				if len(tags) > 0 {
					return tags, nil
				}
			}
		}
	}
	// Fallback to curated defaults
	return defaultTags, nil
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
		return r.GetPosts(ctx, limit, "", "")
	}
	// ✅ FIX: Real 24h trending — filter by createdAt then sort by viewCount client-side
	yesterday := time.Now().Add(-24 * time.Hour)
	docs, err := r.client.Collection("community_posts").
		Where("createdAt", ">=", yesterday).
		OrderBy("createdAt", firestore.Desc).
		Limit(int(limit) * 3). // fetch more, sort client-side
		Documents(ctx).GetAll()

	if err != nil {
		// Fallback: global top view count (no time filter)
		docs, err = r.client.Collection("community_posts").
			OrderBy("viewCount", firestore.Desc).
			Limit(limit).
			Documents(ctx).GetAll()
		if err != nil {
			return nil, err
		}
	}

	var posts []models.Post
	for _, doc := range docs {
		var p models.Post
		if err := doc.DataTo(&p); err == nil {
			p.ID = doc.Ref.ID
			posts = append(posts, p)
		}
	}

	// Sort by viewCount descending, then cap to limit
	sort.Slice(posts, func(i, j int) bool {
		return posts[i].ViewCount > posts[j].ViewCount
	})
	if len(posts) > limit {
		posts = posts[:limit]
	}
	return posts, nil
}

func (r *firestoreRepo) GetMarketplaceProducts(ctx context.Context, limit int, afterID string, provinceCode string) ([]models.MarketplaceProduct, error) {
	if r.client == nil {
		return []models.MarketplaceProduct{
			{ID: "demo1", ProductName: "สินค้าตัวอย่าง 1", Price: 299, Province: "เชียงใหม่", Category: "food", Status: "active"},
			{ID: "demo2", ProductName: "สินค้าตัวอย่าง 2", Price: 599, Province: "กรุงเทพมหานคร", Category: "craft", IsOtop: true, Status: "active"},
		}, nil
	}

	q := r.client.Collection("marketplace_items").
		Where("status", "==", "active").
		OrderBy("createdAt", firestore.Desc)

	if provinceCode != "" {
		q = q.Where("provinceCode", "==", provinceCode)
	}

	if afterID != "" {
		docRef, err := r.client.Collection("marketplace_items").Doc(afterID).Get(ctx)
		if err == nil {
			q = q.StartAfter(docRef)
		}
	}

	docs, err := q.Limit(limit).Documents(ctx).GetAll()

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
	// ✅ FIX: Use subcollection instead of growing array (avoids 1MB Firestore doc limit)
	userLikeRef := r.client.Collection("user_likes").Doc(userID).Collection("posts").Doc(postID)

	var liked bool
	err := r.client.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		likeDoc, err := tx.Get(userLikeRef)
		isLiked := err == nil && likeDoc.Exists()

		if isLiked {
			// Unlike: delete subcollection doc + decrement counter
			if err := tx.Update(postRef, []firestore.Update{
				{Path: "likes", Value: firestore.Increment(-1)},
			}); err != nil {
				return err
			}
			if err := tx.Delete(userLikeRef); err != nil {
				return err
			}
			liked = false
		} else {
			// Like: create subcollection doc + increment counter
			if err := tx.Update(postRef, []firestore.Update{
				{Path: "likes", Value: firestore.Increment(1)},
			}); err != nil {
				return err
			}
			if err := tx.Set(userLikeRef, map[string]interface{}{
				"postId":  postID,
				"likedAt": firestore.ServerTimestamp,
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

	r.viewMutex.Lock()
	r.viewBuffer[postID]++
	r.viewMutex.Unlock()

	return nil
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
		log.Printf("🔥 Firestore Error [GetLiveSessions]: %v", err)
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

// ── Core Content APIs ───────────────────────────────────────────────────────

func (r *firestoreRepo) GetPost(ctx context.Context, postID string) (*models.Post, error) {
	if r.client == nil {
		return &models.Post{ID: postID, Content: "Demo Post", AuthorName: "System", CreatedAt: time.Now()}, nil
	}
	doc, err := r.client.Collection("community_posts").Doc(postID).Get(ctx)
	if err != nil {
		return nil, err
	}
	var p models.Post
	if err := doc.DataTo(&p); err != nil {
		return nil, err
	}
	p.ID = doc.Ref.ID
	return &p, nil
}

func (r *firestoreRepo) CreatePost(ctx context.Context, post *models.Post) error {
	if r.client == nil {
		return nil
	}
	post.CreatedAt = time.Now()
	_, _, err := r.client.Collection("community_posts").Add(ctx, post)
	return err
}

func (r *firestoreRepo) GetComments(ctx context.Context, postID string, limit int, afterID string) ([]models.Comment, error) {
	if r.client == nil {
		return []models.Comment{{ID: "c1", PostID: postID, Content: "Great post!", AuthorName: "Demo User", CreatedAt: time.Now()}}, nil
	}

	q := r.client.Collection("post_comments").
		Where("postId", "==", postID).
		OrderBy("createdAt", firestore.Desc)

	if afterID != "" {
		docRef, err := r.client.Collection("post_comments").Doc(afterID).Get(ctx)
		if err == nil {
			q = q.StartAfter(docRef)
		}
	}

	docs, err := q.Limit(limit).Documents(ctx).GetAll()
	if err != nil {
		return nil, err
	}
	var comments []models.Comment
	for _, doc := range docs {
		var c models.Comment
		if err := doc.DataTo(&c); err == nil {
			c.ID = doc.Ref.ID
			comments = append(comments, c)
		}
	}
	return comments, nil
}

func (r *firestoreRepo) CreateComment(ctx context.Context, comment *models.Comment) error {
	if r.client == nil {
		return nil
	}
	comment.CreatedAt = time.Now()

	return r.client.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		// 1. Add comment
		docRef := r.client.Collection("post_comments").NewDoc()
		if err := tx.Set(docRef, comment); err != nil {
			return err
		}
		// 2. Increment comment count on post
		postRef := r.client.Collection("community_posts").Doc(comment.PostID)
		if err := tx.Update(postRef, []firestore.Update{{Path: "commentsCount", Value: firestore.Increment(1)}}); err != nil {
			return err
		}
		return nil
	})
}

func (r *firestoreRepo) GetUserPosts(ctx context.Context, userID string, limit int) ([]models.Post, error) {
	if r.client == nil {
		return r.GetPosts(ctx, limit, "", "")
	}
	docs, err := r.client.Collection("community_posts").
		Where("authorId", "==", userID).
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

func (r *firestoreRepo) SearchPosts(ctx context.Context, query string, limit int) ([]models.Post, error) {
	if r.client == nil {
		return []models.Post{}, nil
	}
	// Note: Firestore doesn't support full-text search natively well.
	// For basic exact match on categories / titles or prefix search
	// We'll use a basic category filter or return global recent if query is empty for now.
	docs, err := r.client.Collection("community_posts").
		Where("category", "==", query).
		Limit(limit).
		Documents(ctx).GetAll()

	if err != nil {
		log.Printf("🔥 Firestore Error [SearchPosts]: %v", err)
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

func (r *firestoreRepo) GetUserAffinity(ctx context.Context, userID string) (string, string, error) {
	if r.client == nil {
		return "", "", nil
	}
	doc, err := r.client.Collection("line_users").Doc(userID).Get(ctx)
	if err != nil {
		return "", "", err
	}
	data := doc.Data()
	province, _ := data["provinceCode"].(string)
	if province == "" {
		province, _ = data["lastProvinceCode"].(string)
	}
	category, _ := data["preferredCategory"].(string)
	if category == "" {
		category, _ = data["topCategory"].(string)
	}
	return province, category, nil
}

