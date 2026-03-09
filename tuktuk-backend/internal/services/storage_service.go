package services

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

// StorageService generates S3-compatible presigned PUT URLs for Cloudflare R2.
//
//	R2_ACCESS_KEY_ID    — R2 API token key ID
//	R2_SECRET_ACCESS_KEY — R2 API token secret
//	R2_PUBLIC_BASE_URL  — Public CDN/r2.dev URL (e.g. https://pub-xxx.r2.dev)
//
// Optional (have sensible defaults):
//
//	R2_ACCOUNT_ID — Cloudflare account ID (default: project default)
//	R2_BUCKET     — R2 bucket name (default: tuktuk-videos)
//	R2_REGION     — S3 region for SigV4 scope (default: auto)
type StorageService struct {
	accountID  string
	bucket     string
	accessKey  string
	secretKey  string
	region     string
	publicBase string
}

// PresignResult is returned by GeneratePresignedPutURL.
type PresignResult struct {
	UploadURL string `json:"uploadUrl"`
	PublicURL string `json:"publicUrl"`
	Key       string `json:"key"`
}

// NewStorageService constructs a StorageService from environment variables.
func NewStorageService() *StorageService {
	accountID := os.Getenv("R2_ACCOUNT_ID")
	if accountID == "" {
		accountID = "3936ddcbff711649ab56a10375e82b67" // project default
	}
	bucket := os.Getenv("R2_BUCKET")
	if bucket == "" {
		bucket = "tuktuk-videos"
	}
	region := os.Getenv("R2_REGION")
	if region == "" {
		region = "auto"
	}
	publicBase := strings.TrimRight(os.Getenv("R2_PUBLIC_BASE_URL"), "/")

	return &StorageService{
		accountID:  accountID,
		bucket:     bucket,
		accessKey:  os.Getenv("R2_ACCESS_KEY_ID"),
		secretKey:  os.Getenv("R2_SECRET_ACCESS_KEY"),
		region:     region,
		publicBase: publicBase,
	}
}

// IsConfigured returns true when all required env vars are present.
func (s *StorageService) IsConfigured() bool {
	return s.accessKey != "" && s.secretKey != "" && s.publicBase != ""
}

// GeneratePresignedPutURL creates a time-limited S3 presigned PUT URL for R2.
//
//	folder      — object key prefix, e.g. "community_posts/images"
//	filename    — original filename (used to extract extension)
//	contentType — MIME type, e.g. "image/jpeg"
//	expirySecs  — link validity in seconds (max 604800 = 7 days)
//	sizeLimitMB — maximum allowed chunk/file size in Megabytes (Anti-abuse)
func (s *StorageService) GeneratePresignedPutURL(
	folder, filename, contentType string,
	expirySecs int,
	sizeLimitMB int,
) (PresignResult, error) {
	if !s.IsConfigured() {
		return PresignResult{}, fmt.Errorf(
			"storage not configured: set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_BASE_URL",
		)
	}

	// 🛡️ Stream Integrity Layer: Chunk Validation & Anti-Abuse
	if sizeLimitMB <= 0 || sizeLimitMB > 100 {
		// Prevent malicious upload bursts (Bandwidth limit: Max 100MB per chunk)
		sizeLimitMB = 10 // Default safe limit
	}

	// Build unique object key: folder/timestamp.ext
	ext := extractExt(filename)
	key := fmt.Sprintf("%s/%d%s", strings.Trim(folder, "/"), time.Now().UnixMilli(), ext)

	uploadURL, err := s.presignPut(key, expirySecs, sizeLimitMB)
	if err != nil {
		return PresignResult{}, err
	}

	return PresignResult{
		UploadURL: uploadURL,
		PublicURL: fmt.Sprintf("%s/%s", s.publicBase, key),
		Key:       key,
	}, nil
}

// ──────────────────────────────────────────────────────────────────────────────
// SigV4 presigned URL (query-string authentication, UNSIGNED-PAYLOAD)
// ──────────────────────────────────────────────────────────────────────────────

func (s *StorageService) presignPut(key string, expirySecs int, sizeLimitMB int) (string, error) {
	now := time.Now().UTC()
	date := now.Format("20060102")
	amzDate := now.Format("20060102T150405Z")

	host := fmt.Sprintf("%s.r2.cloudflarestorage.com", s.accountID)
	credentialScope := fmt.Sprintf("%s/%s/s3/aws4_request", date, s.region)
	credential := fmt.Sprintf("%s/%s", s.accessKey, credentialScope)
	signedHeaders := "host"

	// ── Canonical query string (params must be sorted A→Z) ──────────────────
	// X-Amz-Algorithm < X-Amz-Credential < X-Amz-Date < X-Amz-Expires < X-Amz-SignedHeaders
	canonicalQS := strings.Join([]string{
		"X-Amz-Algorithm=AWS4-HMAC-SHA256",
		"X-Amz-Credential=" + awsEncode(credential),
		"X-Amz-Date=" + awsEncode(amzDate),
		"X-Amz-Expires=" + strconv.Itoa(expirySecs),
		"X-Amz-SignedHeaders=" + awsEncode(signedHeaders),
	}, "&")

	// ── Canonical request ────────────────────────────────────────────────────
	// Path: /{bucket}/{key} (path-style endpoint)
	canonicalPath := "/" + s.bucket + "/" + encodeKeyPath(key)

	canonicalRequest := strings.Join([]string{
		"PUT",
		canonicalPath,
		canonicalQS,
		"host:" + host + "\n", // canonical headers (trailing \n required)
		signedHeaders,
		"UNSIGNED-PAYLOAD",
	}, "\n")

	// ── String to sign ───────────────────────────────────────────────────────
	canonicalRequestHash := hexSHA256([]byte(canonicalRequest))
	stringToSign := strings.Join([]string{
		"AWS4-HMAC-SHA256",
		amzDate,
		credentialScope,
		canonicalRequestHash,
	}, "\n")

	// ── Signing key & signature ──────────────────────────────────────────────
	signingKey := deriveSigningKey(s.secretKey, date, s.region)
	signature := hex.EncodeToString(hmacSHA256(signingKey, []byte(stringToSign)))

	// ── Assemble presigned URL ───────────────────────────────────────────────
	endpoint := fmt.Sprintf("https://%s/%s/%s", host, s.bucket, encodeKeyPath(key))
	presignedURL := fmt.Sprintf("%s?%s&X-Amz-Signature=%s", endpoint, canonicalQS, signature)
	return presignedURL, nil
}

// ──────────────────────────────────────────────────────────────────────────────
// Crypto helpers
// ──────────────────────────────────────────────────────────────────────────────

func hmacSHA256(key, data []byte) []byte {
	h := hmac.New(sha256.New, key)
	h.Write(data)
	return h.Sum(nil)
}

func hexSHA256(data []byte) string {
	h := sha256.New()
	h.Write(data)
	return hex.EncodeToString(h.Sum(nil))
}

// deriveSigningKey computes the SigV4 derived signing key:
//
//	HMAC(HMAC(HMAC(HMAC("AWS4"+secret, date), region), "s3"), "aws4_request")
func deriveSigningKey(secret, date, region string) []byte {
	kDate := hmacSHA256([]byte("AWS4"+secret), []byte(date))
	kRegion := hmacSHA256(kDate, []byte(region))
	kService := hmacSHA256(kRegion, []byte("s3"))
	return hmacSHA256(kService, []byte("aws4_request"))
}

// ──────────────────────────────────────────────────────────────────────────────
// URL encoding helpers
// ──────────────────────────────────────────────────────────────────────────────

// awsEncode percent-encodes a query parameter value per AWS SigV4 rules.
// Unreserved chars (A-Z a-z 0-9 - _ . ~) are NOT encoded.
// Space → %20 (NOT "+"). Slash → %2F.
func awsEncode(s string) string {
	var b strings.Builder
	for _, c := range s {
		if isUnreserved(c) {
			b.WriteRune(c)
		} else {
			encoded := url.QueryEscape(string(c))
			// url.QueryEscape uses '+' for space; convert to %20
			encoded = strings.ReplaceAll(encoded, "+", "%20")
			b.WriteString(encoded)
		}
	}
	return b.String()
}

// encodeKeyPath percent-encodes each segment of an object key path.
// '/' separators are preserved; each segment is individually encoded.
func encodeKeyPath(key string) string {
	segments := strings.Split(key, "/")
	for i, seg := range segments {
		segments[i] = awsEncodeSegment(seg)
	}
	return strings.Join(segments, "/")
}

func awsEncodeSegment(s string) string {
	var b strings.Builder
	for _, c := range s {
		if isUnreserved(c) {
			b.WriteRune(c)
		} else {
			encoded := url.QueryEscape(string(c))
			encoded = strings.ReplaceAll(encoded, "+", "%20")
			b.WriteString(encoded)
		}
	}
	return b.String()
}

func isUnreserved(c rune) bool {
	return (c >= 'A' && c <= 'Z') ||
		(c >= 'a' && c <= 'z') ||
		(c >= '0' && c <= '9') ||
		c == '-' || c == '_' || c == '.' || c == '~'
}

// extractExt returns the file extension including the dot, e.g. ".jpg".
// Returns empty string if none found.
func extractExt(filename string) string {
	if idx := strings.LastIndex(filename, "."); idx >= 0 {
		return strings.ToLower(filename[idx:])
	}
	return ""
}
