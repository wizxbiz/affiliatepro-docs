/**
 * Firestore → Cloudflare D1 Migration Script
 * ─────────────────────────────────────────────
 * ดึงข้อมูลจาก Firestore collections → insert ลง D1 ผ่าน Wrangler REST API
 *
 * Usage:
 *   node scripts/migrate-firestore-to-d1.mjs
 *
 * Prerequisites:
 *   1. Set GOOGLE_APPLICATION_CREDENTIALS หรือ serviceAccountKey.json
 *   2. Set CF_API_TOKEN, CF_ACCOUNT_ID, D1_DATABASE_ID ใน .env
 *   3. npm install firebase-admin dotenv
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { createInterface } from 'readline';

// ── Config ────────────────────────────────────────────────────
// Load service account (ปรับ path ตามของคุณ)
const serviceAccount = JSON.parse(readFileSync('../serviceAccountKey.json', 'utf8'));

// Cloudflare D1 API config (จาก wrangler.toml)
const CF_ACCOUNT_ID  = process.env.CF_ACCOUNT_ID  || 'YOUR_ACCOUNT_ID';
const CF_API_TOKEN   = process.env.CF_API_TOKEN   || 'YOUR_API_TOKEN';
const D1_DATABASE_ID = process.env.D1_DATABASE_ID || 'YOUR_D1_DATABASE_ID';

// ── Initialize Firebase Admin ─────────────────────────────────
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

// ── D1 Query Helper ───────────────────────────────────────────
async function d1Execute(sql, params = []) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
    }
  );
  const data = await response.json();
  if (!data.success) throw new Error(`D1 Error: ${JSON.stringify(data.errors)}`);
  return data.result;
}

// ── Batch insert helper ───────────────────────────────────────
async function batchInsert(tableName, rows, columns, valueMapper) {
  const BATCH_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    for (const row of batch) {
      try {
        const values = valueMapper(row);
        const placeholders = values.map(() => '?').join(', ');
        await d1Execute(
          `INSERT OR IGNORE INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
          values
        );
        inserted++;
      } catch (err) {
        console.error(`  ⚠️  Failed to insert row:`, err.message, row.id || '');
      }
    }
    console.log(`  📦 ${tableName}: ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length} processed...`);
  }
  return inserted;
}

// ── Migration Functions ───────────────────────────────────────

async function migrateUsers() {
  console.log('\n👤 Migrating users...');
  const snapshot = await db.collection('users').get();
  const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`  Found ${docs.length} users`);

  const inserted = await batchInsert('users',
    docs,
    ['id', 'line_user_id', 'firebase_uid', 'display_name', 'email', 'picture_url',
     'role', 'seller_status', 'is_premium', 'subscription_status', 'provider', 'created_at', 'updated_at'],
    (d) => [
      d.lineUserId || d.id,
      d.lineUserId || null,
      d.firebaseUid || d.id,
      d.displayName || d.name || '',
      d.email || null,
      d.pictureUrl || d.photoURL || null,
      d.role || 'user',
      d.sellerStatus || 'none',
      (d.isPremium || d.subscriptionStatus === 'active') ? 1 : 0,
      d.subscriptionStatus || null,
      d.provider || (d.lineUserId ? 'line' : 'google'),
      d.createdAt?.toMillis?.() || Date.now(),
      d.updatedAt?.toMillis?.() || Date.now(),
    ]
  );
  console.log(`  ✅ Migrated ${inserted} users`);
}

async function migrateLineUsers() {
  console.log('\n📱 Migrating line_users (as users)...');
  const snapshot = await db.collection('line_users').get();
  const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`  Found ${docs.length} LINE users`);

  let merged = 0;
  for (const d of docs) {
    try {
      await d1Execute(`
        INSERT OR IGNORE INTO users (id, line_user_id, display_name, picture_url,
          role, seller_status, is_premium, subscription_status, provider, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        d.userId || d.id,
        d.userId || d.id,
        d.displayName || '',
        d.pictureUrl || null,
        d.role || 'user',
        d.sellerStatus || 'none',
        (d.subscriptionStatus === 'active' || d.isPremium) ? 1 : 0,
        d.subscriptionStatus || null,
        'line',
        d.createdAt?.toMillis?.() || Date.now(),
        d.updatedAt?.toMillis?.() || Date.now(),
      ]);
      merged++;
    } catch {}
  }
  console.log(`  ✅ Merged ${merged} LINE users`);
}

async function migratePosts() {
  console.log('\n📝 Migrating posts...');
  const snapshot = await db.collection('posts').get();
  const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`  Found ${docs.length} posts`);

  const inserted = await batchInsert('posts',
    docs,
    ['id', 'user_id', 'content', 'media_urls', 'category', 'status',
     'likes_count', 'comments_count', 'created_at'],
    (d) => [
      d.id,
      d.userId || d.lineUserId || d.uid || '',
      d.content || d.caption || '',
      JSON.stringify(d.mediaUrls || d.images || d.videoUrls || []),
      d.category || 'general',
      d.status || 'active',
      d.likesCount || d.likes || 0,
      d.commentsCount || d.comments || 0,
      d.createdAt?.toMillis?.() || Date.now(),
    ]
  );
  console.log(`  ✅ Migrated ${inserted} posts`);
}

async function migrateProducts() {
  console.log('\n🛒 Migrating products...');
  const snapshot = await db.collection('marketplace_items').get();
  const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`  Found ${docs.length} products`);

  // Ensure all sellers exist in D1 users first to prevent foreign key errors
  const uniqueSellerIds = [...new Set(docs.map(d => d.sellerId || d.userId || d.lineUserId || '').filter(id => id))];
  console.log(`  Checking ${uniqueSellerIds.length} unique sellers...`);
  for (const sellerId of uniqueSellerIds) {
    try {
      const queryResult = await d1Execute('SELECT id FROM users WHERE id = ?', [sellerId]);
      // Note: Cloudflare D1 query API returns results directly in an array or results array
      const hasUser = queryResult && (
        (Array.isArray(queryResult) && queryResult.length > 0 && queryResult[0].results && queryResult[0].results.length > 0) ||
        (queryResult.results && queryResult.results.length > 0)
      );

      if (!hasUser) {
        console.log(`  👤 Seller ${sellerId} missing from D1 users. Creating placeholder...`);
        let displayName = 'ผู้ขายระบบ';
        if (sellerId.startsWith('tuktuk_official')) {
          displayName = 'TukTuk Official';
        } else if (sellerId.startsWith('service_provider')) {
          displayName = 'ผู้ให้บริการระบบ';
        }
        
        await d1Execute(`
          INSERT OR IGNORE INTO users (id, display_name, role, provider, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          sellerId,
          displayName,
          'user',
          'system',
          Date.now(),
          Date.now()
        ]);
      }
    } catch (err) {
      console.warn(`  ⚠️ Failed to check/create placeholder user for ${sellerId}:`, err.message);
    }
  }

  const inserted = await batchInsert('products',
    docs,
    ['id', 'seller_id', 'title', 'description', 'price', 'images', 'category', 'status', 'created_at'],
    (d) => [
      d.id,
      d.sellerId || d.userId || d.lineUserId || '',
      d.productName || d.title || d.name || '',
      d.description || '',
      d.price || 0,
      JSON.stringify(d.images || d.imageUrls || (d.imageUrl ? [d.imageUrl] : [])),
      d.category || 'general',
      d.status || 'active',
      d.createdAt?.toMillis?.() || Date.now(),
    ]
  );
  console.log(`  ✅ Migrated ${inserted} products`);
}

async function migrateWebPins() {
  console.log('\n🔑 Migrating web_pins...');
  const snapshot = await db.collection('web_pins').get();
  const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`  Found ${docs.length} web pins`);

  for (const d of docs) {
    try {
      await d1Execute(`
        INSERT OR IGNORE INTO web_pins (line_user_id, pin, expires_at, created_at)
        VALUES (?, ?, ?, ?)
      `, [d.lineUserId || d.id, d.pin || '', d.expiresAt?.toMillis?.() || 0, Date.now()]);
    } catch {}
  }
  console.log('  ✅ Migrated web_pins');
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Starting Firestore → D1 Migration');
  console.log(`   Account: ${CF_ACCOUNT_ID}`);
  console.log(`   Database: ${D1_DATABASE_ID}`);
  console.log('');

  try {
    await migrateUsers();
    await migrateLineUsers();
    await migratePosts();
    await migrateProducts();
    await migrateWebPins();

    console.log('\n✅ Migration completed successfully!');
    console.log('   Next steps:');
    console.log('   1. Verify data: wrangler d1 execute tuktukfeed-db --command "SELECT COUNT(*) FROM users"');
    console.log('   2. Deploy workers: cd workers && npm run deploy');
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  }
}

main();
