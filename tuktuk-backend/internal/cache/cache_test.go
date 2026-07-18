package cache

import (
	"context"
	"testing"
	"time"
)

func TestMemCache_SetGetDelete(t *testing.T) {
	c := NewMemoryCache()
	ctx := context.Background()

	// 1. Test Set and Get
	err := c.Set(ctx, "test_key", "test_value", 5*time.Second)
	if err != nil {
		t.Fatalf("Set failed: %v", err)
	}

	var val string
	err = c.Get(ctx, "test_key", &val)
	if err != nil {
		t.Fatalf("Get failed: %v", err)
	}
	if val != "test_value" {
		t.Errorf("Expected 'test_value', got '%s'", val)
	}

	// 2. Test Get non-existent
	err = c.Get(ctx, "non_existent", &val)
	if err == nil {
		t.Errorf("Expected error for non_existent key")
	}

	// 3. Test Delete
	err = c.Delete(ctx, "test_key")
	if err != nil {
		t.Fatalf("Delete failed: %v", err)
	}

	err = c.Get(ctx, "test_key", &val)
	if err == nil {
		t.Errorf("Expected error after delete, but got value: %s", val)
	}
}

func TestMemCache_Expiration(t *testing.T) {
	c := NewMemoryCache()
	ctx := context.Background()

	// Short expiration (10ms)
	_ = c.Set(ctx, "expire_key", "data", 10*time.Millisecond)

	time.Sleep(20 * time.Millisecond) // Wait to expire

	var val string
	err := c.Get(ctx, "expire_key", &val)
	if err == nil {
		t.Errorf("Expected error for expired key, got value: %s", val)
	}
}
