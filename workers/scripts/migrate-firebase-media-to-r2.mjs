/**
 * Firebase Storage → Cloudflare R2 Media Migration
 * ─────────────────────────────────────────────────
 * ดาวน์โหลดไฟล์จาก Firebase Storage ผ่าน Admin SDK
 * แล้วอัปโหลดขึ้น R2 และ update URL ใน D1
 *
 * Usage:
 *   set R2_ACCESS_KEY_ID=...
 *   set R2_SECRET_ACCESS_KEY=...
 *   set CF_API_TOKEN=...
 *   set CF_ACCOUNT_ID=...
 *   set D1_DATABASE_ID=...
 *   node scripts/migrate-firebase-media-to-r2.mjs
 */

import admin from 'firebase-admin';
import { createReadStream, createWriteStream, existsSync } from 'fs';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHmac } from 'crypto';
import fetch from 'node-fetch';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── Config ────────────────────────────────────────────────────
const SA = JSON.parse(await readFile(join(ROOT, '../serviceAccountKey.json'), 'utf8'));
const CF_API_TOKEN   = process.env.CF_API_TOKEN;
const CF_ACCOUNT_ID  = process.env.CF_ACCOUNT_ID;
const D1_DATABASE_ID = process.env.D1_DATABASE_ID;
const R2_ACCESS_KEY  = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_KEY  = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET      = 'tuktuk-videos';
const R2_PUBLIC_BASE = 'https://pub-7e55074f08794361aaf305c1967f6ffa.r2.dev';
const REGION         = 'auto';

for (const v of ['CF_API_TOKEN','CF_ACCOUNT_ID','D1_DATABASE_ID','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY']) {
  if (!process.env[v]) { console.error('Missing env:', v); process.exit(1); }
}

// ── Firebase ──────────────────────────────────────────────────
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(SA),
    storageBucket: SA.project_id + '.appspot.com' });
}
const bucket = admin.storage().bucket();

// ── D1 helper ─────────────────────────────────────────────────
async function d1(sql, params = []) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`,
    { method: 'POST',
      headers: { Authorization: `Bearer ${CF_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql, params }) }
  );
  const d = await res.json();
  if (!d.success) throw new Error(JSON.stringify(d.errors));
  return d.result;
}

// ── SigV4 presigned PUT for R2 ─────────────────────────────────
function pad(n) { return String(n).padStart(2, '0'); }

function hexHmac(key, data) {
  return createHmac('sha256', key).update(data).digest();
}
function hexHmacHex(key, data) {
  return createHmac('sha256', key).update(data).digest('hex');
}
import { createHash } from 'crypto';
function sha256(s) { return createHash('sha256').update(s).digest('hex'); }

async function r2PutPresign(key, contentType) {
  const now = new Date();
  const dateStr = `${now.getUTCFullYear()}${pad(now.getUTCMonth()+1)}${pad(now.getUTCDate())}`;
  const amzDate = `${dateStr}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
  const credScope = `${dateStr}/${REGION}/s3/aws4_request`;
  const credential = `${R2_ACCESS_KEY}/${credScope}`;
  const host = `${CF_ACCOUNT_ID}.r2.cloudflarestorage.com`;

  const qs = [
    ['X-Amz-Algorithm','AWS4-HMAC-SHA256'],
    ['X-Amz-Credential', credential],
    ['X-Amz-Date', amzDate],
    ['X-Amz-Expires', '900'],
    ['X-Amz-SignedHeaders', 'host'],
  ].map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');

  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  const canonReq = ['PUT', `/${R2_BUCKET}/${encodedKey}`, qs, `host:${host}\n`, 'host', 'UNSIGNED-PAYLOAD'].join('\n');
  const sts = ['AWS4-HMAC-SHA256', amzDate, credScope, sha256(canonReq)].join('\n');

  const kDate    = hexHmac(`AWS4${R2_SECRET_KEY}`, dateStr);
  const kRegion  = hexHmac(kDate, REGION);
  const kService = hexHmac(kRegion, 's3');
  const kSign    = hexHmac(kService, 'aws4_request');
  const sig      = hexHmacHex(kSign, sts);

  return `https://${host}/${R2_BUCKET}/${encodedKey}?${qs}&X-Amz-Signature=${sig}`;
}

// ── Upload Buffer to R2 ────────────────────────────────────────
async function uploadToR2(buffer, key, contentType) {
  const url = await r2PutPresign(key, contentType);
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: buffer,
  });
  if (!res.ok) throw new Error(`R2 PUT ${res.status}: ${await res.text()}`);
  return `${R2_PUBLIC_BASE}/${key}`;
}

// ── Download from Firebase Storage ────────────────────────────
async function downloadFirebase(url) {
  // Handle both storage.googleapis.com and firebasestorage.googleapis.com
  let dlUrl = url;
  if (url.includes('firebasestorage.googleapis.com')) {
    // Extract path from firebasestorage URL and get a fresh download URL via Admin SDK
    const match = url.match(/\/o\/([^?]+)/);
    if (match) {
      const filePath = decodeURIComponent(match[1]);
      const file = bucket.file(filePath);
      const [exists] = await file.exists();
      if (!exists) return null;
      const [signedUrl] = await file.getSignedUrl({
        action: 'read', expires: Date.now() + 5 * 60 * 1000
      });
      dlUrl = signedUrl;
    }
  } else if (url.includes('storage.googleapis.com')) {
    // Public bucket URL — extract bucket/path
    const match = url.match(/storage\.googleapis\.com\/([^/]+)\/(.+)/);
    if (match) {
      const filePath = match[2];
      const file = admin.storage().bucket(match[1]).file(filePath);
      const [exists] = await file.exists();
      if (!exists) return null;
      const [signedUrl] = await file.getSignedUrl({
        action: 'read', expires: Date.now() + 5 * 60 * 1000
      });
      dlUrl = signedUrl;
    }
  }

  const res = await fetch(dlUrl, { timeout: 30000 });
  if (!res.ok) return null;
  return { buffer: Buffer.from(await res.arrayBuffer()), contentType: res.headers.get('content-type') || 'application/octet-stream' };
}

// ── Detect ext from content-type ──────────────────────────────
function ext(ct) {
  const m = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp',
               'image/gif': '.gif', 'image/heic': '.heic',
               'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov' };
  return m[ct.split(';')[0].trim()] || '';
}

// ── Normalize media entry → extract URL ─────────────────────
function extractUrl(entry) {
  if (typeof entry === 'string') return entry;
  if (entry && entry.url) return entry.url;
  return null;
}

function isFirebaseUrl(url) {
  return url && (url.includes('firebasestorage.googleapis.com') || url.includes('storage.googleapis.com'));
}

// ── Process one row (posts or products) ──────────────────────
async function processMediaField(id, rawJson, folder, stats) {
  let arr;
  try { arr = JSON.parse(rawJson); } catch { return rawJson; }
  if (!Array.isArray(arr)) return rawJson;

  let changed = false;
  const updated = await Promise.all(arr.map(async (entry) => {
    const url = extractUrl(entry);
    if (!url || !isFirebaseUrl(url)) return entry; // skip YouTube / already R2

    console.log(`  ⬇️  ${url.slice(0, 80)}…`);
    const dl = await downloadFirebase(url).catch(e => { console.error('  ❌ dl error:', e.message); return null; });
    if (!dl) { stats.failed++; return entry; }

    const fileExt = ext(dl.contentType) || (dl.contentType.startsWith('video') ? '.mp4' : '.jpg');
    const key = `${folder}/${Date.now()}_${id.slice(0,8)}${fileExt}`;
    const newUrl = await uploadToR2(dl.buffer, key, dl.contentType).catch(e => { console.error('  ❌ r2 error:', e.message); return null; });
    if (!newUrl) { stats.failed++; return entry; }

    console.log(`  ✅  → ${newUrl}`);
    stats.migrated++;
    changed = true;

    // keep same shape (string or object)
    if (typeof entry === 'string') return newUrl;
    return { ...entry, url: newUrl };
  }));

  return changed ? JSON.stringify(updated) : rawJson;
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  const stats = { migrated: 0, failed: 0, skipped: 0 };
  console.log('🚀 Firebase Storage → R2 Migration\n');

  // ── POSTS ────────────────────────────────────────────────
  console.log('📝 Processing posts…');
  const postsRes = await d1(
    "SELECT id, media_urls FROM posts WHERE media_urls LIKE '%googleapis%' AND media_urls IS NOT NULL"
  );
  const posts = postsRes[0]?.results || [];
  console.log(`  Found ${posts.length} posts with Firebase media`);

  for (const row of posts) {
    console.log(`\n  post ${row.id}`);
    const newJson = await processMediaField(row.id, row.media_urls, 'community_posts', stats);
    if (newJson !== row.media_urls) {
      await d1('UPDATE posts SET media_urls = ? WHERE id = ?', [newJson, row.id]);
    } else {
      stats.skipped++;
    }
  }

  // ── PRODUCTS ─────────────────────────────────────────────
  console.log('\n🛍️  Processing products…');
  const prodRes = await d1(
    "SELECT id, images FROM products WHERE images LIKE '%googleapis%' AND images IS NOT NULL"
  );
  const products = prodRes[0]?.results || [];
  console.log(`  Found ${products.length} products with Firebase images`);

  for (const row of products) {
    console.log(`\n  product ${row.id}`);
    const newJson = await processMediaField(row.id, row.images, 'products', stats);
    if (newJson !== row.images) {
      await d1('UPDATE products SET images = ? WHERE id = ?', [newJson, row.id]);
    } else {
      stats.skipped++;
    }
  }

  console.log('\n─────────────────────────────────');
  console.log(`✅ Migrated: ${stats.migrated} files`);
  console.log(`⏭️  Skipped:  ${stats.skipped} records (already R2 / no change)`);
  console.log(`❌ Failed:   ${stats.failed} files`);
  process.exit(0);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
