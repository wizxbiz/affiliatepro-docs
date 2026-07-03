import admin from 'firebase-admin';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── Configuration ────────────────────────────────────────────────────────────
const SA = JSON.parse(readFileSync(join(ROOT, '../serviceAccountKey.json'), 'utf8'));
const R2_BUCKET = 'tuktuk-videos';
const R2_PUBLIC_BASE = 'https://pub-7e55074f08794361aaf305c1967f6ffa.r2.dev';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(SA),
    storageBucket: 'appinjproject.firebasestorage.app',
  });
}
const db = admin.firestore();
const bucket = admin.storage().bucket();

// Helper to check if a URL points to Firebase Storage
function isFirebaseUrl(url) {
  return typeof url === 'string' && (url.includes('firebasestorage.googleapis.com') || url.includes('storage.googleapis.com'));
}

// Extract Firebase Storage file path from URL
function getFirebasePath(url) {
  let match = url.match(/\/o\/([^?]+)/);
  if (match) return decodeURIComponent(match[1]);

  match = url.match(/storage\.googleapis\.com\/([^/]+)\/(.+)/);
  if (match) return decodeURIComponent(match[2]);

  return null;
}

// Download file from Firebase Storage to local temp path
async function downloadFile(url, tempPath) {
  const filePath = getFirebasePath(url);
  if (!filePath) throw new Error(`Could not parse path from URL: ${url}`);

  const file = bucket.file(filePath);
  const [exists] = await file.exists();
  if (!exists) {
    throw new Error(`File does not exist in Firebase Storage: ${filePath}`);
  }

  await file.download({ destination: tempPath });
}

// Upload file to R2 via wrangler CLI
function uploadToR2(localPath, key, contentType) {
  const objectPath = `${R2_BUCKET}/${key}`;
  console.log(`    📤 Uploading to R2: ${objectPath} (${contentType})`);
  
  // Execute wrangler CLI command
  const cmd = `npx wrangler@3 r2 object put "${objectPath}" --file="${localPath}" --content-type="${contentType}"`;
  execSync(cmd, { stdio: 'inherit' });
  
  return `${R2_PUBLIC_BASE}/${key}`;
}

// Helper to determine content type and extension
function getMeta(url) {
  const clean = url.split('?')[0].toLowerCase();
  if (clean.endsWith('.mp4')) return { contentType: 'video/mp4', ext: '.mp4' };
  if (clean.endsWith('.webm')) return { contentType: 'video/webm', ext: '.webm' };
  if (clean.endsWith('.mov')) return { contentType: 'video/quicktime', ext: '.mov' };
  if (clean.endsWith('.jpg') || clean.endsWith('.jpeg')) return { contentType: 'image/jpeg', ext: '.jpg' };
  if (clean.endsWith('.png')) return { contentType: 'image/png', ext: '.png' };
  if (clean.endsWith('.webp')) return { contentType: 'image/webp', ext: '.webp' };
  if (clean.endsWith('.gif')) return { contentType: 'image/gif', ext: '.gif' };

  // Fallback
  if (clean.includes('video')) return { contentType: 'video/mp4', ext: '.mp4' };
  return { contentType: 'image/jpeg', ext: '.jpg' };
}

// Ensure local temp dir exists
const tempDir = join(ROOT, 'temp_media');
if (!existsSync(tempDir)) {
  mkdirSync(tempDir, { recursive: true });
}

async function main() {
  console.log('🚀 Starting Firestore community_posts -> D1 Sync & R2 Media Migration');

  const snapshot = await db.collection('community_posts').get();
  console.log(`  Found ${snapshot.size} posts in Firestore community_posts`);

  const sqlStatements = [];
  let migratedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const doc of snapshot.docs) {
    const d = doc.data();
    if (d.published === false || d.isPublic === false || d.privacy === 'private') {
      skippedCount++;
      continue;
    }

    console.log(`\n📦 Processing post ${doc.id} by ${d.authorName || 'Anonymous'}...`);

    // Extract all media sources
    const rawUrls = [];
    if (Array.isArray(d.images)) {
      d.images.forEach(m => {
        if (typeof m === 'string') rawUrls.push(m);
        else if (m && typeof m === 'object' && m.url) rawUrls.push(m.url);
      });
    }
    if (d.imageUrl) rawUrls.push(d.imageUrl);
    if (d.videoUrl) rawUrls.push(d.videoUrl);
    if (d.youtubeUrl) rawUrls.push(d.youtubeUrl);

    const uniqueUrls = [...new Set(rawUrls.filter(Boolean))];
    const finalMedia = [];

    for (const url of uniqueUrls) {
      if (isFirebaseUrl(url)) {
        console.log(`  Found Firebase media: ${url.slice(0, 80)}...`);
        const { contentType, ext } = getMeta(url);
        const r2Key = `community_posts/${Date.now()}_${doc.id.slice(0, 8)}${ext}`;
        const tempPath = join(tempDir, `temp_${doc.id}_${Date.now()}${ext}`);

        try {
          console.log(`    ⬇️  Downloading from Firebase...`);
          await downloadFile(url, tempPath);

          console.log(`    ✨ Uploading to R2...`);
          const r2Url = uploadToR2(tempPath, r2Key, contentType);
          
          // Re-classify type for final media array object
          const type = contentType.startsWith('video') ? 'video' : 'image';
          finalMedia.push({ url: r2Url, type });
          migratedCount++;
        } catch (err) {
          failedCount++;
          console.error(`    ❌ Failed to migrate media:`, err.message);
          // Keep original url as fallback
          const type = getMeta(url).contentType.startsWith('video') ? 'video' : 'image';
          finalMedia.push({ url, type });
        }
      } else {
        // Already R2 or YouTube or other external link
        const type = (url.includes('youtube.com') || url.includes('youtu.be')) ? 'youtube' : getMeta(url).contentType.startsWith('video') ? 'video' : 'image';
        finalMedia.push({ url, type });
      }
    }

    // Build values for INSERT OR REPLACE
    const userId = d.authorId || d.userId || 'tuktuk_official';
    const content = [d.title, d.content || d.description].filter(Boolean).join('\n\n');
    const mediaUrlsJson = JSON.stringify(finalMedia);
    const category = d.category || 'general';
    const status = 'active';
    const likes = d.likes || 0;
    const commentsCount = d.commentsCount || 0;
    const views = d.views || d.viewCount || 0;

    const toMillis = (v) => {
      if (!v) return Date.now();
      if (typeof v.toMillis === 'function') return v.toMillis();
      if (typeof v === 'number') return v;
      const parsed = Date.parse(v);
      return Number.isNaN(parsed) ? Date.now() : parsed;
    };

    const createdAt = toMillis(d.createdAt);
    const updatedAt = toMillis(d.updatedAt || d.createdAt);

    // Escape SQL strings safely
    const esc = (s) => String(s || '').replace(/'/g, "''");

    const sql = `INSERT OR REPLACE INTO posts (id, user_id, content, media_urls, category, status, likes_count, comments_count, views_count, created_at, updated_at) VALUES ('${esc(doc.id)}', '${esc(userId)}', '${esc(content)}', '${esc(mediaUrlsJson)}', '${esc(category)}', '${esc(status)}', ${likes}, ${commentsCount}, ${views}, ${createdAt}, ${updatedAt});`;
    sqlStatements.push(sql);
  }

  // Save SQL file
  const sqlPath = join(ROOT, 'scripts/update_all_posts.sql');
  writeFileSync(sqlPath, sqlStatements.join('\n'), 'utf8');
  console.log(`\n💾 Saved SQL migration file to: ${sqlPath}`);

  // Execute SQL in Cloudflare D1
  console.log('\n🔥 Running SQL update in D1 database...');
  try {
    execSync(`npx wrangler@3 d1 execute tuktukfeed-db --remote --file="scripts/update_all_posts.sql"`, { stdio: 'inherit' });
    console.log('\n✅ D1 Database update successful!');
  } catch (err) {
    console.error('\n❌ D1 Database update failed:', err.message);
  }

  console.log('\n────────────────────────────────────────────────────────────');
  console.log(`🎉 Sync Completed!`);
  console.log(`  - Migrated media files: ${migratedCount}`);
  console.log(`  - Failed media files: ${failedCount}`);
  console.log(`  - Skipped unpublished posts: ${skippedCount}`);
  console.log(`────────────────────────────────────────────────────────────`);

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
