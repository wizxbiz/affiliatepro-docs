# 🚀 Deployment Guide - TukTuk Thailand Cloudflare

## Pre-Deployment Checklist

### ✅ ก่อน Deploy ต้องเช็ค:

1. **D1 Database มีข้อมูลหรือยัง?**
   ```bash
   node check-d1-data.js
   ```

2. **Workers API ทำงานหรือยัง?**
   ```bash
   node test-api.js
   ```

3. **Feed Cards Render ถูกต้องหรือยัง?**
   ```bash
   node test-feed-cards.js
   ```

4. **Code push ไป GitHub แล้วหรือยัง?**
   ```bash
   git status
   git push origin V.4-Ultra
   ```

---

## 🌐 Deploy Cloudflare Workers API

### ขั้นตอนที่ 1: Login to Cloudflare

```bash
npx wrangler login
```

### ขั้นตอนที่ 2: Deploy Workers

```bash
cd D:/1_Developer/Flutterapp/caculateapp
npx wrangler deploy
```

**Expected Output:**
```
✅ Successfully published your script to
 https://tuktukfeed-api.imtthailand2019.workers.dev
```

### ขั้นตอนที่ 3: Test Deployed Worker

```bash
curl https://tuktukfeed-api.imtthailand2019.workers.dev/api/utility/health
```

**Expected:**
```json
{"ok":true,"timestamp":1234567890}
```

---

## 📄 Deploy Cloudflare Pages (Next.js SEO)

### ⚠️ หมายเหตุสำคัญ:
- Node.js v20 ไม่รองรับ Wrangler v4 CLI deploy
- **แนะนำ: Deploy ผ่าน Cloudflare Dashboard + GitHub Integration**

---

## 🎯 Method 1: Deploy via Cloudflare Dashboard (แนะนำ)

### Step 1: เปิด Cloudflare Dashboard

1. ไปที่: https://dash.cloudflare.com
2. เลือก **Workers & Pages** (sidebar ซ้าย)
3. คลิก **Create Application**
4. เลือก **Pages** tab
5. คลิก **Connect to Git**

### Step 2: Connect GitHub

1. เลือก **GitHub**
2. Authorize Cloudflare
3. เลือก repository: **`wizxbiz/affiliatepro-docs`**
4. คลิก **Begin setup**

### Step 3: Configure Build Settings

```yaml
Project name: tuktukfeed-seo
Production branch: V.4-Ultra

Framework preset: Next.js

Build command:
cd seo-web && npm ci && npx @cloudflare/next-on-pages

Build output directory:
seo-web/.vercel/output/static

Root directory:
(leave empty)
```

### Step 4: Environment Variables

คลิก **Add variable** แล้วเพิ่ม:

| Variable | Value |
|----------|-------|
| `NODE_VERSION` | `20` |
| `NEXT_PUBLIC_API_BASE` | `https://tuktukfeed-api.imtthailand2019.workers.dev/api/v1` |

### Step 5: Deploy!

1. กด **Save and Deploy**
2. รอประมาณ 2-3 นาที
3. จะได้ URL: `https://tuktukfeed-seo.pages.dev`

---

## 🎯 Method 2: Deploy via CLI (Alternative)

### Requirements:
- Node.js v20+
- Wrangler CLI installed

### Commands:

```bash
# Install dependencies
cd seo-web
npm install

# Build
npm run build

# Deploy (if wrangler pages deploy works)
npx wrangler pages deploy .vercel/output/static --project-name=tuktukfeed-seo
```

---

## 📱 Deploy Main Web App (index.html + iframe)

### Option A: Cloudflare Pages (Static)

1. ไปที่ Cloudflare Dashboard → Pages → Create
2. Connect Git → เลือก repo
3. Build settings:
   ```yaml
   Project name: tuktukfeed-main
   Branch: V.4-Ultra
   Build command: (empty - static files only)
   Build output: public
   ```
4. Deploy

### Option B: Firebase Hosting (Keep existing)

```bash
# Update หน้าเว็บเก่า
firebase deploy --only hosting
```

---

## 🗄️ Setup D1 Database (ถ้ายังไม่มีข้อมูล)

### ขั้นตอนที่ 1: Create D1 Database

```bash
npx wrangler d1 create tuktukfeed-db
```

### ขั้นตอนที่ 2: Run Migrations

```bash
# Init schema
npx wrangler d1 execute tuktukfeed-db --file=workers/migrations/001_init.sql

# Seed data (if available)
npx wrangler d1 execute tuktukfeed-db --file=workers/migrations/002_seed.sql
```

### ขั้นตอนที่ 3: Bind D1 to Worker

แก้ไข `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "tuktukfeed-db"
database_id = "<your-database-id>"
```

### ขั้นตอนที่ 4: Migrate Data from Firestore

```bash
# TODO: Create migration script
node migrate-firestore-to-d1.js
```

---

## 🎨 Setup R2 Storage

### ขั้นตอนที่ 1: Create R2 Bucket

```bash
npx wrangler r2 bucket create tuktukfeed-media
```

### ขั้นตอนที่ 2: Enable Public Access

1. ไปที่ Cloudflare Dashboard → R2
2. เลือก bucket `tuktukfeed-media`
3. Settings → Public Access → Enable
4. จะได้ URL: `https://pub-xxxxx.r2.dev`

### ขั้นตอนที่ 3: Bind R2 to Worker

แก้ไข `wrangler.toml`:
```toml
[[r2_buckets]]
binding = "MEDIA_BUCKET"
bucket_name = "tuktukfeed-media"
```

---

## 🔧 Post-Deployment Verification

### 1. Test Workers API

```bash
curl https://tuktukfeed-api.imtthailand2019.workers.dev/api/utility/health
curl https://tuktukfeed-api.imtthailand2019.workers.dev/api/v1/feed?limit=5
```

### 2. Test Next.js SEO

```bash
curl https://tuktukfeed-seo.pages.dev/
```

Expected: HTML page with feed content

### 3. Test Super Admin

1. เปิด `https://tuktukfeed-seo.pages.dev/super-admin.html`
2. Login with PIN or Google
3. Check dashboard loads

### 4. Test Feed Cards

1. เปิด `https://tuktukfeed-seo.pages.dev/`
2. เช็คว่าการ์ดโพสต์แสดงถูกต้อง
3. คลิก Like/Comment ทำงานหรือยัง

---

## 🌐 Custom Domain Setup

### ขั้นตอนที่ 1: Add Domain to Pages

1. Pages → Settings → Custom domains
2. Add custom domain: `tuktukfeed.com`
3. Add DNS records ตามที่ Cloudflare แนะนำ

### ขั้นตอนที่ 2: SSL/TLS

- SSL Certificate: Auto-provisioned by Cloudflare
- Wait 5-10 minutes for activation

---

## 📊 Monitoring & Logs

### View Worker Logs

```bash
npx wrangler tail
```

### View Pages Deployment Logs

1. Cloudflare Dashboard → Pages → Deployments
2. Click on deployment → View logs

### D1 Query Logs

1. Cloudflare Dashboard → D1 → tuktukfeed-db
2. Console → View query history

---

## 🔄 Rollback Strategy

### Rollback Pages Deployment

1. Cloudflare Dashboard → Pages → Deployments
2. Click on previous deployment
3. **Rollback to this deployment**

### Rollback Worker

```bash
npx wrangler rollback
```

---

## 🚨 Troubleshooting

### Issue: "D1 binding not found"

**Fix:**
```bash
# Re-deploy with bindings
npx wrangler deploy
```

### Issue: "R2 bucket not found"

**Fix:**
1. Check bucket exists: `npx wrangler r2 bucket list`
2. Verify binding in `wrangler.toml`

### Issue: "Next.js build failed"

**Fix:**
```bash
cd seo-web
rm -rf node_modules .next
npm install
npm run build
```

### Issue: "Feed returns empty"

**Fix:**
1. Check D1 has data: `node check-d1-data.js`
2. Run migration: `npx wrangler d1 execute tuktukfeed-db --file=workers/migrations/002_seed.sql`

---

## 📝 Deployment Checklist

### Pre-Deployment:
- [ ] Git code pushed to `V.4-Ultra`
- [ ] `node check-d1-data.js` passes
- [ ] `node test-api.js` passes
- [ ] `node test-feed-cards.js` passes

### Deployment:
- [ ] Workers API deployed
- [ ] Next.js SEO deployed to Pages
- [ ] D1 Database created & migrated
- [ ] R2 Bucket created & configured

### Post-Deployment:
- [ ] Workers API health check passes
- [ ] Pages site loads
- [ ] Super Admin login works
- [ ] Feed cards render correctly
- [ ] Custom domain configured (optional)

---

## 🎯 Success Criteria

### ✅ Deployment Successful When:

1. **Workers API responds:**
   ```bash
   curl https://tuktukfeed-api.imtthailand2019.workers.dev/api/utility/health
   # → {"ok":true}
   ```

2. **Pages loads:**
   ```bash
   curl https://tuktukfeed-seo.pages.dev/
   # → HTML with content
   ```

3. **Feed has data:**
   ```bash
   curl https://tuktukfeed-api.imtthailand2019.workers.dev/api/v1/feed?limit=1
   # → {"posts": [{ ... }]}
   ```

4. **Super Admin works:**
   - Login successful
   - Dashboard loads
   - CRUD operations work

---

**เอกสารนี้อัปเดต:** 2026-07-03
**สถานะ:** Ready for Production Deployment 🚀
