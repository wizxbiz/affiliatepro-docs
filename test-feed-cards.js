#!/usr/bin/env node
/**
 * Test Feed Cards Rendering
 * ทดสอบการแสดงการ์ดโพสต์ทุกประเภท
 *
 * Usage:
 *   node test-feed-cards.js
 */

const WORKER_API = process.env.WORKER_API || 'https://tuktukfeed-api.imtthailand2019.workers.dev';

async function testFeedCards() {
  console.log('🎴 Testing Feed Card Rendering...\n');
  console.log(`API: ${WORKER_API}\n`);
  console.log('─'.repeat(70));

  // Test 1: Get feed with mixed content
  console.log('\n1️⃣  Testing Mixed Feed (Posts + Products)...');
  try {
    const res = await fetch(`${WORKER_API}/api/v1/feed?userId=guest&limit=20`);
    const data = await res.json();

    if (!res.ok) {
      console.log(`❌ Failed: ${data.error}`);
      return false;
    }

    const posts = data.posts || [];
    console.log(`✅ Loaded ${posts.length} items`);

    // Count by type
    const videoPosts = posts.filter(p => p.type === 'video' || p.videoUrl);
    const imagePosts = posts.filter(p => p.type === 'image' || (p.mediaUrls && p.mediaUrls.length > 0));
    const productCards = posts.filter(p => p.type === 'product' || p.productId);

    console.log(`   📹 Video posts: ${videoPosts.length}`);
    console.log(`   🖼️  Image posts: ${imagePosts.length}`);
    console.log(`   🛍️  Product cards: ${productCards.length}`);

    // Check required fields
    const missingFields = posts.filter(p => !p.id || !p.authorName);
    if (missingFields.length > 0) {
      console.log(`⚠️  ${missingFields.length} items missing required fields`);
    }

  } catch (err) {
    console.log(`❌ Error: ${err.message}`);
    return false;
  }

  // Test 2: Get pure posts feed
  console.log('\n2️⃣  Testing Posts-Only Feed...');
  try {
    const res = await fetch(`${WORKER_API}/api/db/posts?limit=10`);
    const data = await res.json();

    if (!res.ok) {
      console.log(`❌ Failed: ${data.error}`);
      return false;
    }

    const posts = data.results || [];
    console.log(`✅ Loaded ${posts.length} posts`);

    if (posts.length > 0) {
      const sample = posts[0];
      console.log(`   Sample: ${sample.id} by ${sample.user_id || 'unknown'}`);
      console.log(`   Content: ${(sample.content || '').substring(0, 50)}...`);
    }

  } catch (err) {
    console.log(`❌ Error: ${err.message}`);
    return false;
  }

  // Test 3: Get products feed
  console.log('\n3️⃣  Testing Products-Only Feed...');
  try {
    const res = await fetch(`${WORKER_API}/api/db/products?limit=10`);
    const data = await res.json();

    if (!res.ok) {
      console.log(`❌ Failed: ${data.error}`);
      return false;
    }

    const products = data.results || [];
    console.log(`✅ Loaded ${products.length} products`);

    if (products.length > 0) {
      const sample = products[0];
      console.log(`   Sample: ${sample.id} - ${sample.title || sample.productName}`);
      console.log(`   Price: ฿${Number(sample.price || 0).toLocaleString('th-TH')}`);
    }

  } catch (err) {
    console.log(`❌ Error: ${err.message}`);
    return false;
  }

  // Test 4: Test location-based feed
  console.log('\n4️⃣  Testing Location-Based Feed (Bangkok)...');
  try {
    const res = await fetch(`${WORKER_API}/api/v1/feed?userId=guest&province=กรุงเทพมหานคร&limit=10`);
    const data = await res.json();

    if (!res.ok) {
      console.log(`❌ Failed: ${data.error}`);
      return false;
    }

    const posts = data.posts || [];
    console.log(`✅ Loaded ${posts.length} items from Bangkok`);

  } catch (err) {
    console.log(`❌ Error: ${err.message}`);
    return false;
  }

  console.log('\n─'.repeat(70));
  console.log('\n✅ All feed card tests passed!\n');
  return true;
}

testFeedCards().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
