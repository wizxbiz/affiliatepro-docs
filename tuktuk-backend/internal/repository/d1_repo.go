package repository

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
	"tuktuk-backend/internal/models"
)

type d1Repo struct {
	accountID  string
	apiToken   string
	databaseID string
	client     *http.Client
}

// NewD1Repository creates a Repository backed by Cloudflare D1 REST API
func NewD1Repository(accountID, apiToken, databaseID string) Repository {
	return &d1Repo{
		accountID:  accountID,
		apiToken:   apiToken,
		databaseID: databaseID,
		client:     &http.Client{Timeout: 10 * time.Second},
	}
}

// ── D1 HTTP REQUEST SCHEMAS ───────────────────────────────────

type d1QueryRequest struct {
	SQL    string `json:"sql"`
	Params []any  `json:"params"`
}

type d1ResultBlock[T any] struct {
	Results []T  `json:"results"`
	Success bool `json:"success"`
}

type d1QueryResponse[T any] struct {
	Result  []d1ResultBlock[T] `json:"result"`
	Success bool               `json:"success"`
	Errors  []any              `json:"errors"`
}

func executeD1Query[T any](r *d1Repo, sql string, params ...any) ([]T, error) {
	reqBody, err := json.Marshal(d1QueryRequest{SQL: sql, Params: params})
	if err != nil {
		return nil, err
	}

	url := fmt.Sprintf("https://api.cloudflare.com/client/v4/accounts/%s/d1/database/%s/query", r.accountID, r.databaseID)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+r.apiToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := r.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("D1 API status %d: %s", resp.StatusCode, string(body))
	}

	var d1Resp d1QueryResponse[T]
	if err := json.NewDecoder(resp.Body).Decode(&d1Resp); err != nil {
		return nil, err
	}

	if !d1Resp.Success || len(d1Resp.Result) == 0 {
		return nil, fmt.Errorf("D1 query execution failed")
	}

	return d1Resp.Result[0].Results, nil
}

// ── INTERMEDIATE D1 SCHEMAS ────────────────────────────────────

type d1Post struct {
	ID            string `json:"id"`
	UserID        string `json:"user_id"`
	AuthorName    string `json:"display_name"`
	AuthorAvatar  string `json:"picture_url"`
	Content       string `json:"content"`
	MediaUrls     string `json:"media_urls"`
	Likes         int    `json:"likes_count"`
	CommentsCount int    `json:"comments_count"`
	Category      string `json:"category"`
	ViewCount     int    `json:"views_count"`
	CreatedAt     int64  `json:"created_at"`
}

func (dp d1Post) ToPost() models.Post {
	var rawMedia []any
	_ = json.Unmarshal([]byte(dp.MediaUrls), &rawMedia)
	
	var media []string
	for _, m := range rawMedia {
		if s, ok := m.(string); ok {
			media = append(media, s)
		} else if obj, ok := m.(map[string]any); ok {
			if urlVal, exists := obj["url"]; exists {
				if sUrl, ok := urlVal.(string); ok {
					media = append(media, sUrl)
				}
			}
		}
	}
	
	videoURL := ""
	thumbURL := ""
	if len(media) > 0 {
		videoURL = media[0]
		thumbURL = media[0]
		if len(media) > 1 {
			thumbURL = media[1]
		}
	}
	return models.Post{
		ID:            dp.ID,
		AuthorID:      dp.UserID,
		AuthorName:    dp.AuthorName,
		AuthorAvatar:  dp.AuthorAvatar,
		Content:       dp.Content,
		VideoURL:      videoURL,
		ThumbnailURL:  thumbURL,
		Likes:         dp.Likes,
		CommentsCount: dp.CommentsCount,
		Category:      dp.Category,
		ViewCount:     dp.ViewCount,
		CreatedAt:     time.UnixMilli(dp.CreatedAt),
	}
}

type d1Notification struct {
	ID        string `json:"id"`
	UserID    string `json:"user_id"`
	Title     string `json:"title"`
	Body      string `json:"body"`
	IsRead    int    `json:"is_read"`
	CreatedAt int64  `json:"created_at"`
}

func (dn d1Notification) ToNotification() models.Notification {
	return models.Notification{
		ID:          dn.ID,
		RecipientID: dn.UserID,
		Title:       dn.Title,
		Text:        dn.Body,
		Read:        dn.IsRead == 1,
		CreatedAt:   time.UnixMilli(dn.CreatedAt),
	}
}

type d1News struct {
	ID            string `json:"id"`
	Title         string `json:"title"`
	Summary       string `json:"summary"`
	SummaryPoints string `json:"summary_points"`
	ImageUrl      string `json:"image_url"`
	Source        string `json:"source"`
	SourceUrl     string `json:"source_url"`
	Category      string `json:"category"`
	AiInsight     string `json:"ai_insight"`
	IsVerified    int    `json:"is_verified"`
	Confidence    float64`json:"confidence"`
	CreatedAt     int64  `json:"created_at"`
}

func (dn d1News) ToNews() models.News {
	var pts []string
	_ = json.Unmarshal([]byte(dn.SummaryPoints), &pts)
	return models.News{
		ID:            dn.ID,
		Title:         dn.Title,
		Summary:       dn.Summary,
		SummaryPoints: pts,
		ImageUrl:      dn.ImageUrl,
		Source:        dn.Source,
		SourceUrl:     dn.SourceUrl,
		Category:      dn.Category,
		AiInsight:     dn.AiInsight,
		IsVerified:    dn.IsVerified == 1,
		Confidence:    dn.Confidence,
		CreatedAt:     time.UnixMilli(dn.CreatedAt),
	}
}

type d1Product struct {
	ID          string  `json:"id"`
	SellerID    string  `json:"seller_id"`
	SellerName  string  `json:"seller_name"`
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	Images      string  `json:"images"`
	Category    string  `json:"category"`
	ViewsCount  int     `json:"views_count"`
	CreatedAt   int64   `json:"created_at"`
}

func (dp d1Product) ToProduct() models.MarketplaceProduct {
	var rawImgs []any
	_ = json.Unmarshal([]byte(dp.Images), &rawImgs)
	
	var imgs []string
	for _, m := range rawImgs {
		if s, ok := m.(string); ok {
			imgs = append(imgs, s)
		} else if obj, ok := m.(map[string]any); ok {
			if urlVal, exists := obj["url"]; exists {
				if sUrl, ok := urlVal.(string); ok {
					imgs = append(imgs, sUrl)
				}
			}
		}
	}
	
	imgURL := ""
	if len(imgs) > 0 {
		imgURL = imgs[0]
	}
	return models.MarketplaceProduct{
		ID:          dp.ID,
		ProductName: dp.Title,
		Description: dp.Description,
		Price:       dp.Price,
		ImageURL:    imgURL,
		SellerName:  dp.SellerName,
		SellerID:    dp.SellerID,
		Category:    dp.Category,
		ViewCount:   dp.ViewsCount,
		CreatedAt:   time.UnixMilli(dp.CreatedAt),
	}
}

type d1LiveSession struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Thumbnail   string `json:"thumbnail"`
	PlaybackURL string `json:"playback_url"`
	AgencyName  string `json:"agency_name"`
	IsOfficial  int    `json:"is_official"`
	VerifyType  string `json:"verify_type"`
	ViewerCount int    `json:"viewer_count"`
	Status      string `json:"status"`
	CreatedAt   int64  `json:"created_at"`
}

func (dl d1LiveSession) ToLiveSession() models.LiveSession {
	return models.LiveSession{
		ID:          dl.ID,
		Title:       dl.Title,
		Description: dl.Description,
		Thumbnail:   dl.Thumbnail,
		PlaybackURL: dl.PlaybackURL,
		Broadcaster: models.LiveBroadcaster{
			AgencyName: dl.AgencyName,
			IsOfficial: dl.IsOfficial == 1,
			VerifyType: dl.VerifyType,
		},
		ViewerCount: dl.ViewerCount,
		Status:      dl.Status,
		CreatedAt:   time.UnixMilli(dl.CreatedAt),
	}
}

type d1UserAffinity struct {
	ProvinceCode      string `json:"province_code"`
	PreferredCategory string `json:"preferred_category"`
}

// ── REPOSITORY INTERFACE IMPLEMENTATIONS ───────────────────────

func (r *d1Repo) GetPosts(ctx context.Context, limit int, afterID string, provinceCode string) ([]models.Post, error) {
	query := `
		SELECT p.id, p.user_id, u.display_name, u.picture_url, p.content, p.media_urls,
		       p.likes_count, p.comments_count, p.category, p.views_count, p.created_at
		FROM posts p
		LEFT JOIN users u ON p.user_id = u.id
		WHERE p.status = 'active'
	`
	var params []any
	if provinceCode != "" {
		query += " AND u.province_code = ?"
		params = append(params, provinceCode)
	}
	query += " ORDER BY p.created_at DESC LIMIT ?"
	params = append(params, limit)

	rows, err := executeD1Query[d1Post](r, query, params...)
	if err != nil {
		return nil, err
	}

	posts := make([]models.Post, len(rows))
	for i, row := range rows {
		posts[i] = row.ToPost()
	}
	return posts, nil
}

func (r *d1Repo) GetUnreadNotifications(ctx context.Context, userID string) ([]models.Notification, error) {
	query := `
		SELECT id, user_id, title, body, is_read, created_at
		FROM notifications
		WHERE user_id = ? AND is_read = 0
		ORDER BY created_at DESC LIMIT 10
	`
	rows, err := executeD1Query[d1Notification](r, query, userID)
	if err != nil {
		return nil, err
	}

	notifs := make([]models.Notification, len(rows))
	for i, row := range rows {
		notifs[i] = row.ToNotification()
	}
	return notifs, nil
}

func (r *d1Repo) GetTrendingTags(ctx context.Context) ([]string, error) {
	return []string{"#Thailand", "#Travel", "#Food", "#MuayThai", "#SoftPower", "#OTOP", "#TukTuk"}, nil
}

func (r *d1Repo) GetVerifiedNews(ctx context.Context, limit int) ([]models.News, error) {
	query := `
		SELECT id, title, summary, summary_points, image_url, source, source_url, category, ai_insight, is_verified, confidence, created_at
		FROM news_feed
		WHERE status = 'active' AND is_verified = 1
		ORDER BY created_at DESC LIMIT ?
	`
	rows, err := executeD1Query[d1News](r, query, limit)
	if err != nil {
		// Fallback: all active news
		query = `
			SELECT id, title, summary, summary_points, image_url, source, source_url, category, ai_insight, is_verified, confidence, created_at
			FROM news_feed
			WHERE status = 'active'
			ORDER BY created_at DESC LIMIT ?
		`
		rows, err = executeD1Query[d1News](r, query, limit)
		if err != nil {
			return nil, err
		}
	}

	news := make([]models.News, len(rows))
	for i, row := range rows {
		news[i] = row.ToNews()
	}
	return news, nil
}

func (r *d1Repo) GetTrendingPosts(ctx context.Context, limit int) ([]models.Post, error) {
	// Query posts in the last 7 days sorted by viewCount descending
	sevenDaysAgo := time.Now().Add(-7 * 24 * time.Hour).UnixMilli()
	query := `
		SELECT p.id, p.user_id, u.display_name, u.picture_url, p.content, p.media_urls,
		       p.likes_count, p.comments_count, p.category, p.views_count, p.created_at
		FROM posts p
		LEFT JOIN users u ON p.user_id = u.id
		WHERE p.status = 'active' AND p.created_at >= ?
		ORDER BY p.views_count DESC LIMIT ?
	`
	rows, err := executeD1Query[d1Post](r, query, sevenDaysAgo, limit)
	if err != nil {
		return nil, err
	}

	posts := make([]models.Post, len(rows))
	for i, row := range rows {
		posts[i] = row.ToPost()
	}
	return posts, nil
}

func (r *d1Repo) GetMarketplaceProducts(ctx context.Context, limit int, afterID string, provinceCode string) ([]models.MarketplaceProduct, error) {
	query := `
		SELECT p.id, p.seller_id, u.display_name AS seller_name, p.title, p.description, p.price, p.images, p.category, p.views_count, p.created_at
		FROM products p
		LEFT JOIN users u ON p.seller_id = u.id
		WHERE p.status = 'active'
	`
	var params []any
	if provinceCode != "" {
		query += " AND u.province_code = ?"
		params = append(params, provinceCode)
	}
	query += " ORDER BY p.created_at DESC LIMIT ?"
	params = append(params, limit)

	rows, err := executeD1Query[d1Product](r, query, params...)
	if err != nil {
		return nil, err
	}

	products := make([]models.MarketplaceProduct, len(rows))
	for i, row := range rows {
		products[i] = row.ToProduct()
	}
	return products, nil
}

func (r *d1Repo) GetLeaderboard(ctx context.Context, limit int) ([]models.SellerLeaderboard, error) {
	// Query top sellers
	query := `
		SELECT id, display_name, picture_url
		FROM users
		WHERE role = 'user' AND seller_status = 'verified'
		LIMIT ?
	`
	type rawSeller struct {
		ID          string `json:"id"`
		DisplayName string `json:"display_name"`
		PictureUrl  string `json:"picture_url"`
	}
	rows, err := executeD1Query[rawSeller](r, query, limit)
	if err != nil {
		return nil, err
	}

	sellers := make([]models.SellerLeaderboard, len(rows))
	for i, row := range rows {
		sellers[i] = models.SellerLeaderboard{
			Rank:       i + 1,
			SellerID:   row.ID,
			ShopName:   row.DisplayName,
			Avatar:     row.PictureUrl,
			TotalSales: 50000.0 - float64(i*5000), // mock
			OrderCount: 100 - i*10,
			Rating:     4.9 - float64(i)*0.1,
		}
	}
	return sellers, nil
}

func (r *d1Repo) TogglePostLike(ctx context.Context, postID string, userID string) (bool, error) {
	// First check if user already liked it
	checkQuery := "SELECT COUNT(*) AS count FROM post_likes WHERE post_id = ? AND user_id = ?"
	type countBlock struct {
		Count int `json:"count"`
	}
	checks, err := executeD1Query[countBlock](r, checkQuery, postID, userID)
	if err != nil {
		return false, err
	}

	liked := false
	if len(checks) > 0 && checks[0].Count > 0 {
		// Unlike
		_, _ = executeD1Query[any](r, "DELETE FROM post_likes WHERE post_id = ? AND user_id = ?", postID, userID)
		_, _ = executeD1Query[any](r, "UPDATE posts SET likes_count = MAX(0, likes_count - 1) WHERE id = ?", postID)
		liked = false
	} else {
		// Like
		_, _ = executeD1Query[any](r, "INSERT INTO post_likes (post_id, user_id, created_at) VALUES (?, ?, ?)", postID, userID, DateNowMilli())
		_, _ = executeD1Query[any](r, "UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?", postID)
		liked = true
	}
	return liked, nil
}

func (r *d1Repo) IncrementViewCount(ctx context.Context, postID string) error {
	_, err := executeD1Query[any](r, "UPDATE posts SET views_count = views_count + 1 WHERE id = ?", postID)
	return err
}

func (r *d1Repo) GetLiveSessions(ctx context.Context, limit int) ([]models.LiveSession, error) {
	query := `
		SELECT id, title, description, thumbnail, playback_url, agency_name, is_official, verify_type, viewer_count, status, created_at
		FROM live_sessions
		WHERE status = 'live'
		ORDER BY created_at DESC LIMIT ?
	`
	rows, err := executeD1Query[d1LiveSession](r, query, limit)
	if err != nil {
		return nil, err
	}

	sessions := make([]models.LiveSession, len(rows))
	for i, row := range rows {
		sessions[i] = row.ToLiveSession()
	}
	return sessions, nil
}

func (r *d1Repo) UpdateLiveHeadline(ctx context.Context, sessionID string, headlines []string) error {
	hJSON, _ := json.Marshal(headlines)
	_, err := executeD1Query[any](r, "UPDATE live_sessions SET headlines = ? WHERE id = ?", string(hJSON), sessionID)
	return err
}

func (r *d1Repo) StartLiveSession(ctx context.Context, session models.LiveSession) (string, error) {
	hJSON, _ := json.Marshal(session.CurrentHeadlines)
	sessionID := fmt.Sprintf("live_%d", DateNowMilli())
	_, err := executeD1Query[any](r, `
		INSERT INTO live_sessions (id, title, description, thumbnail, playback_url, agency_name, is_official, verify_type, viewer_count, status, headlines, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, sessionID, session.Title, session.Description, session.Thumbnail, session.PlaybackURL, session.Broadcaster.AgencyName,
		IntFromBool(session.Broadcaster.IsOfficial), session.Broadcaster.VerifyType, session.ViewerCount, "live", string(hJSON), DateNowMilli())

	if err != nil {
		return "", err
	}
	return sessionID, nil
}

func (r *d1Repo) EndLiveSession(ctx context.Context, sessionID string) error {
	_, err := executeD1Query[any](r, "UPDATE live_sessions SET status = 'ended' WHERE id = ?", sessionID)
	return err
}

func (r *d1Repo) GetLiveSession(ctx context.Context, sessionID string) (*models.LiveSession, error) {
	query := `
		SELECT id, title, description, thumbnail, playback_url, agency_name, is_official, verify_type, viewer_count, status, created_at
		FROM live_sessions
		WHERE id = ?
	`
	rows, err := executeD1Query[d1LiveSession](r, query, sessionID)
	if err != nil || len(rows) == 0 {
		return nil, fmt.Errorf("session not found")
	}
	session := rows[0].ToLiveSession()
	return &session, nil
}

func (r *d1Repo) UpdateViewerCount(ctx context.Context, sessionID string, delta int) error {
	_, err := executeD1Query[any](r, "UPDATE live_sessions SET viewer_count = MAX(0, viewer_count + ?) WHERE id = ?", delta, sessionID)
	return err
}

func (r *d1Repo) GetPost(ctx context.Context, postID string) (*models.Post, error) {
	query := `
		SELECT p.id, p.user_id, u.display_name, u.picture_url, p.content, p.media_urls,
		       p.likes_count, p.comments_count, p.category, p.views_count, p.created_at
		FROM posts p
		LEFT JOIN users u ON p.user_id = u.id
		WHERE p.id = ?
	`
	rows, err := executeD1Query[d1Post](r, query, postID)
	if err != nil || len(rows) == 0 {
		return nil, fmt.Errorf("post not found")
	}
	post := rows[0].ToPost()
	return &post, nil
}

func (r *d1Repo) CreatePost(ctx context.Context, post *models.Post) error {
	media, _ := json.Marshal([]string{post.VideoURL})
	_, err := executeD1Query[any](r, `
		INSERT INTO posts (id, user_id, content, media_urls, category, status, likes_count, comments_count, views_count, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, post.ID, post.AuthorID, post.Content, string(media), post.Category, "active", post.Likes, post.CommentsCount, post.ViewCount, DateNowMilli())
	return err
}

func (r *d1Repo) GetComments(ctx context.Context, postID string, limit int, afterID string) ([]models.Comment, error) {
	query := `
		SELECT c.id, c.post_id, c.user_id, u.display_name, u.picture_url, c.content, c.created_at
		FROM post_comments c
		LEFT JOIN users u ON c.user_id = u.id
		WHERE c.post_id = ?
		ORDER BY c.created_at DESC LIMIT ?
	`
	type rawComment struct {
		ID           string `json:"id"`
		PostID       string `json:"post_id"`
		UserID       string `json:"user_id"`
		DisplayName  string `json:"display_name"`
		PictureUrl   string `json:"picture_url"`
		Content      string `json:"content"`
		CreatedAt    int64  `json:"created_at"`
	}
	rows, err := executeD1Query[rawComment](r, query, postID, limit)
	if err != nil {
		return nil, err
	}

	comments := make([]models.Comment, len(rows))
	for i, row := range rows {
		comments[i] = models.Comment{
			ID:           row.ID,
			PostID:       row.PostID,
			AuthorID:     row.UserID,
			AuthorName:   row.DisplayName,
			AuthorAvatar: row.PictureUrl,
			Content:      row.Content,
			CreatedAt:    time.UnixMilli(row.CreatedAt),
		}
	}
	return comments, nil
}

func (r *d1Repo) CreateComment(ctx context.Context, comment *models.Comment) error {
	commentID := fmt.Sprintf("comment_%d", DateNowMilli())
	_, err := executeD1Query[any](r, `
		INSERT INTO post_comments (id, post_id, user_id, content, created_at)
		VALUES (?, ?, ?, ?, ?)
	`, commentID, comment.PostID, comment.AuthorID, comment.Content, DateNowMilli())
	if err != nil {
		return err
	}
	_, _ = executeD1Query[any](r, "UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?", comment.PostID)
	return nil
}

func (r *d1Repo) GetUserPosts(ctx context.Context, userID string, limit int) ([]models.Post, error) {
	query := `
		SELECT p.id, p.user_id, u.display_name, u.picture_url, p.content, p.media_urls,
		       p.likes_count, p.comments_count, p.category, p.views_count, p.created_at
		FROM posts p
		LEFT JOIN users u ON p.user_id = u.id
		WHERE p.user_id = ? AND p.status = 'active'
		ORDER BY p.created_at DESC LIMIT ?
	`
	rows, err := executeD1Query[d1Post](r, query, userID, limit)
	if err != nil {
		return nil, err
	}

	posts := make([]models.Post, len(rows))
	for i, row := range rows {
		posts[i] = row.ToPost()
	}
	return posts, nil
}

func (r *d1Repo) SearchPosts(ctx context.Context, query string, limit int) ([]models.Post, error) {
	sqlQuery := `
		SELECT p.id, p.user_id, u.display_name, u.picture_url, p.content, p.media_urls,
		       p.likes_count, p.comments_count, p.category, p.views_count, p.created_at
		FROM posts p
		LEFT JOIN users u ON p.user_id = u.id
		WHERE p.status = 'active' AND (p.content LIKE ? OR p.category = ?)
		ORDER BY p.created_at DESC LIMIT ?
	`
	likeQuery := "%" + query + "%"
	rows, err := executeD1Query[d1Post](r, sqlQuery, likeQuery, query, limit)
	if err != nil {
		return nil, err
	}

	posts := make([]models.Post, len(rows))
	for i, row := range rows {
		posts[i] = row.ToPost()
	}
	return posts, nil
}

func (r *d1Repo) GetUserAffinity(ctx context.Context, userID string) (string, string, error) {
	// Query user preference fields from users
	query := `
		SELECT display_name
		FROM users
		WHERE id = ? LIMIT 1
	`
	type basicUser struct {
		DisplayName string `json:"display_name"`
	}
	rows, err := executeD1Query[basicUser](r, query, userID)
	if err != nil || len(rows) == 0 {
		return "", "", err
	}
	// Return mock/defaults since users schema doesn't hold preferred_category yet, or can extend if needed
	return "", "", nil
}

// ── UTILITIES ──────────────────────────────────────────────────

func DateNowMilli() int64 {
	return time.Now().UnixNano() / int64(time.Millisecond)
}

func IntFromBool(b bool) int {
	if b {
		return 1
	}
	return 0
}
