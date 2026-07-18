/**
 * Firestore community_posts → Cloudflare D1 posts
 * ─────────────────────────────────────────────
 * โพสต์ฟีดจริงอยู่ที่ collection `community_posts` (สคริปต์เดิมย้ายจาก `posts` ซึ่งว่าง)
 * รันซ้ำได้ปลอดภัย (INSERT OR IGNORE)
 *
 * Usage:
 *   set CF_API_TOKEN=... & set CF_ACCOUNT_ID=... & set D1_DATABASE_ID=...
 *   node scripts/migrate-community-posts-to-d1.mjs
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('../serviceAccountKey.json', 'utf8'));

const CF_ACCOUNT_ID  = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN   = process.env.CF_API_TOKEN;
const D1_DATABASE_ID = process.env.D1_DATABASE_ID;

if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !D1_DATABASE_ID) {
  console.error('Missing CF_ACCOUNT_ID / CF_API_TOKEN / D1_DATABASE_ID env vars');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

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

function toMillis(v) {
  if (!v) return Date.now();
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (typeof v === 'number') return v;
  const parsed = Date.parse(v);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function collectMediaUrls(d) {
  const urls = [];
  if (Array.isArray(d.images)) urls.push(...d.images);
  if (d.imageUrl) urls.push(d.imageUrl);
  if (d.videoUrl) urls.push(d.videoUrl);
  if (d.youtubeUrl) urls.push(d.youtubeUrl);
  return [...new Set(urls.filter(Boolean))];
}

async function ensureUser(userId, displayName, pictureUrl) {
  await d1Execute(`
    INSERT OR IGNORE INTO users (id, display_name, picture_url, role, provider, created_at, updated_at)
    VALUES (?, ?, ?, 'user', 'system', ?, ?)
  `, [userId, displayName || 'สมาชิก TukTuk', pictureUrl || null, Date.now(), Date.now()]);
}

async function main() {
  console.log('🚀 Migrating Firestore community_posts → D1 posts');
  const snapshot = await db.collection('community_posts').get();
  console.log(`  Found ${snapshot.size} community_posts`);

  let inserted = 0, skipped = 0, failed = 0;
  for (const doc of snapshot.docs) {
    const d = doc.data();
    // ข้ามโพสต์ที่ตั้งใจซ่อนไว้ (unpublished/private) — ค่าอื่นถือว่าแสดงได้
    if (d.published === false || d.isPublic === false || d.privacy === 'private') { skipped++; continue; }

    const userId = d.authorId || d.userId || 'tuktuk_official';
    const content = [d.title, d.content || d.description].filter(Boolean).join('\n\n');
    const media = collectMediaUrls(d);

    try {
      await ensureUser(userId, d.authorName, d.authorPictureUrl || d.authorAvatar);
      await d1Execute(`
        INSERT OR IGNORE INTO posts (id, user_id, content, media_urls, category, status,
          likes_count, comments_count, views_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)
      `, [
        doc.id,
        userId,
        content,
        JSON.stringify(media),
        d.category || 'general',
        d.likes || 0,
        d.commentsCount || 0,
        d.views || d.viewCount || 0,
        toMillis(d.createdAt),
        toMillis(d.updatedAt || d.createdAt),
      ]);
      inserted++;
    } catch (err) {
      failed++;
      console.error(`  ⚠️ ${doc.id}: ${err.message}`);
    }
  }

  console.log(`\n✅ Done — inserted/kept: ${inserted}, skipped (unpublished): ${skipped}, failed: ${failed}`);
  const check = await d1Execute(`SELECT COUNT(*) AS n FROM posts WHERE status='active'`);
  console.log('  D1 active posts now:', JSON.stringify(check?.[0]?.results ?? check));
  process.exit(0);
}

main().catch(e => { console.error('❌', e); process.exit(1); });
