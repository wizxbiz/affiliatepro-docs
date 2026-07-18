package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"
)

// memEntry holds a cached value with its expiry timestamp.
type memEntry struct {
	data      []byte
	expiresAt time.Time
}

// memCache is a thread-safe in-process cache that implements CacheService.
// It requires no external dependencies and works on any host (including
// Fly.io free tier with 256 MB RAM).
//
// A background goroutine evicts expired keys every 5 minutes to prevent
// unbounded memory growth.
type memCache struct {
	mu    sync.RWMutex
	store map[string]memEntry
}

// NewMemoryCache constructs an in-memory CacheService and starts the
// background eviction goroutine.
func NewMemoryCache() CacheService {
	mc := &memCache{store: make(map[string]memEntry)}
	go mc.evictLoop()
	return mc
}

func (c *memCache) Set(_ context.Context, key string, value interface{}, expiration time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("memcache marshal: %w", err)
	}
	c.mu.Lock()
	c.store[key] = memEntry{data: data, expiresAt: time.Now().Add(expiration)}
	c.mu.Unlock()
	return nil
}

func (c *memCache) Get(_ context.Context, key string, dest interface{}) error {
	c.mu.RLock()
	entry, ok := c.store[key]
	c.mu.RUnlock()

	if !ok {
		return fmt.Errorf("cache miss: %s", key)
	}
	if time.Now().After(entry.expiresAt) {
		// Lazy delete — evict loop will clean up, no write-lock needed here
		return fmt.Errorf("cache expired: %s", key)
	}
	return json.Unmarshal(entry.data, dest)
}

func (c *memCache) Delete(_ context.Context, key string) error {
	c.mu.Lock()
	delete(c.store, key)
	c.mu.Unlock()
	return nil
}

// Len returns the number of entries currently held (including expired ones
// not yet evicted). Useful for diagnostics.
func (c *memCache) Len() int {
	c.mu.RLock()
	n := len(c.store)
	c.mu.RUnlock()
	return n
}

// evictLoop runs every 5 minutes and removes entries whose TTL has elapsed.
func (c *memCache) evictLoop() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		now := time.Now()
		c.mu.Lock()
		removed := 0
		for k, v := range c.store {
			if now.After(v.expiresAt) {
				delete(c.store, k)
				removed++
			}
		}
		c.mu.Unlock()
		if removed > 0 {
			log.Printf("[MemCache] evicted %d expired entries", removed)
		}
	}
}
