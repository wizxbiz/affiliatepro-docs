package models

import "time"

// ── Marketplace ──────────────────────────────────────────────────────────────

// MarketplaceProduct mirrors the `marketplace_items` Firestore collection.
type MarketplaceProduct struct {
	ID           string    `json:"id"          firestore:"-"`
	ProductName  string    `json:"productName" firestore:"productName"`
	Description  string    `json:"description" firestore:"description"`
	Price        float64   `json:"price"       firestore:"price"`
	ImageURL     string    `json:"imageUrl"    firestore:"imageUrl"`
	SellerName   string    `json:"sellerName"  firestore:"sellerName"`
	SellerID     string    `json:"sellerId"    firestore:"sellerId"`
	Province     string    `json:"province"    firestore:"province"`      // Legacy text
	ProvinceCode string    `json:"provinceCode" firestore:"provinceCode"` // ISO/TIS Standard
	Category     string    `json:"category"    firestore:"category"`
	IsOtop       bool      `json:"isOtop"      firestore:"isOtop"`
	ViewCount    int       `json:"viewCount"   firestore:"viewCount"`
	Status       string    `json:"status"      firestore:"status"`
	CreatedAt    time.Time `json:"createdAt"   firestore:"createdAt"`
}

// ProductsResponse is returned by GET /api/v1/products.
type ProductsResponse struct {
	Status        string               `json:"status"`
	Products      []MarketplaceProduct `json:"products"`
	Total         int                  `json:"total"`
	ExecutionTime string               `json:"executionTime"`
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

// SellerLeaderboard is one entry in the seller ranking table.
type SellerLeaderboard struct {
	Rank         int     `json:"rank"`
	SellerID     string  `json:"sellerId"    firestore:"-"`
	ShopName     string  `json:"shopName"    firestore:"shopName"`
	Avatar       string  `json:"avatar"      firestore:"pictureUrl"`
	TotalSales   float64 `json:"totalSales"  firestore:"totalSales"`
	OrderCount   int     `json:"orderCount"  firestore:"orderCount"`
	Rating       float64 `json:"rating"      firestore:"rating"`
	Province     string  `json:"province"    firestore:"province"`
	ProvinceCode string  `json:"provinceCode" firestore:"provinceCode"`
}

// LeaderboardResponse is returned by GET /api/v1/leaderboard.
type LeaderboardResponse struct {
	Status        string              `json:"status"`
	Sellers       []SellerLeaderboard `json:"sellers"`
	ExecutionTime string              `json:"executionTime"`
}

type Post struct {
	ID            string    `json:"id" firestore:"-"`
	AuthorID      string    `json:"authorId" firestore:"authorId"`
	AuthorName    string    `json:"authorName" firestore:"authorName"`
	AuthorAvatar  string    `json:"authorAvatar" firestore:"authorAvatar"`
	Content       string    `json:"content" firestore:"content"`
	VideoURL      string    `json:"videoUrl" firestore:"videoUrl"`
	ThumbnailURL  string    `json:"thumbnailUrl" firestore:"thumbnailUrl"`
	Likes         int       `json:"likes" firestore:"likes"`
	CommentsCount int       `json:"commentsCount" firestore:"commentsCount"`
	Category      string    `json:"category" firestore:"category"`
	ProvinceCode  string    `json:"provinceCode" firestore:"provinceCode"`
	Type          string    `json:"type" firestore:"type"` // post, video, image
	ViewCount     int       `json:"viewCount" firestore:"viewCount"`
	CreatedAt     time.Time `json:"createdAt" firestore:"createdAt"`
}

type Notification struct {
	ID           string    `json:"id" firestore:"-"`
	RecipientID  string    `json:"recipientId" firestore:"recipientId"`
	Title        string    `json:"title" firestore:"title"`
	Text         string    `json:"text" firestore:"text"`
	Read         bool      `json:"read" firestore:"read"`
	SenderName   string    `json:"senderName" firestore:"senderName"`
	SenderAvatar string    `json:"senderAvatar" firestore:"senderAvatar"`
	CreatedAt    time.Time `json:"createdAt" firestore:"createdAt"`
}

type UserProfile struct {
	UID         string `json:"uid"`
	DisplayName string `json:"displayName"`
	PhotoURL    string `json:"photoUrl"`
	Bio         string `json:"bio"`
	Followers   int    `json:"followersCount"`
}

type News struct {
	ID            string    `json:"id" firestore:"-"`
	Title         string    `json:"title" firestore:"title"`
	Summary       string    `json:"summary" firestore:"summary"`
	SummaryPoints []string  `json:"summaryPoints" firestore:"summaryPoints"`
	ImageUrl      string    `json:"imageUrl" firestore:"imageUrl"`
	Source        string    `json:"source" firestore:"source"`
	SourceUrl     string    `json:"sourceUrl" firestore:"sourceUrl"`
	Category      string    `json:"category" firestore:"category"`
	AiInsight     string    `json:"aiInsight" firestore:"aiInsight"`
	IsVerified    bool      `json:"isVerified" firestore:"isVerified"`
	Confidence    float64   `json:"confidence" firestore:"confidence"`
	CreatedAt     time.Time `json:"createdAt" firestore:"createdAt"`
}

type FeedResponse struct {
	Status        string         `json:"status"`
	Posts         []Post         `json:"posts"`
	News          []News         `json:"news,omitempty"`
	Notifications []Notification `json:"unreadNotifications"`
	TrendingTags  []string       `json:"trendingTags"`
	ExecutionTime string         `json:"executionTime"`
}

// ── Live Streaming (Phase 1: News Focus) ───────────────────────────────────

type LiveBroadcaster struct {
	ID         string `json:"id"         firestore:"-"`
	AgencyName string `json:"agencyName" firestore:"agencyName"`
	Avatar     string `json:"avatar"     firestore:"avatar"`
	IsOfficial bool   `json:"isOfficial" firestore:"isOfficial"`
	VerifyType string `json:"verifyType" firestore:"verifyType"` // news, govt, emergency
}

type LiveSession struct {
	ID               string          `json:"id"             firestore:"-"`
	Title            string          `json:"title"          firestore:"title"`
	Description      string          `json:"description"    firestore:"description"`
	Thumbnail        string          `json:"thumbnail"      firestore:"thumbnail"`
	StreamURL        string          `json:"streamUrl"      firestore:"-"` // AWS IVS playback URL
	PlaybackURL      string          `json:"playbackUrl"    firestore:"playbackUrl"`
	Broadcaster      LiveBroadcaster `json:"broadcaster" firestore:"broadcaster"`
	ViewerCount      int             `json:"viewerCount"    firestore:"viewerCount"`
	Status           string          `json:"status"         firestore:"status"` // live, ended
	ProvinceCode     string          `json:"provinceCode"   firestore:"provinceCode"`
	Category         string          `json:"category"       firestore:"category"`
	CurrentHeadlines []string        `json:"headlines"      firestore:"headlines"`
	CreatedAt        time.Time       `json:"createdAt"      firestore:"createdAt"`
}

type LiveResponse struct {
	Status        string        `json:"status"`
	LiveSessions  []LiveSession `json:"liveSessions"`
	ExecutionTime string        `json:"executionTime"`
}
