@echo off
REM =============================================================
REM TukTuk Social — Phase 2: Cloudflare Workers Setup
REM =============================================================
REM Account ID: 3936ddcbff711649ab56a10375e82b67 (imtthailand2019@gmail.com)
REM R2 Bucket: tuktuk-videos (มีอยู่แล้ว ✅)
REM
REM ใส่ Token ใหม่ที่สร้างด้วย Template "Edit Cloudflare Workers":
REM

SET CLOUDFLARE_API_TOKEN=YOUR_NEW_TOKEN_HERE
SET CLOUDFLARE_ACCOUNT_ID=3936ddcbff711649ab56a10375e82b67

REM R2 Credentials — ห้าม hardcode: ตั้งค่าใน environment ก่อนรันสคริปต์นี้
IF "%R2_ACCESS_KEY%"=="" (
    echo [ERROR] กรุณา SET R2_ACCESS_KEY และ R2_SECRET_KEY ใน environment ก่อน
    pause
    exit /b 1
)

IF "%CLOUDFLARE_API_TOKEN%"=="YOUR_NEW_TOKEN_HERE" (
    echo [ERROR] กรุณาใส่ CLOUDFLARE_API_TOKEN ก่อน
    echo ดู Token ที่: https://dash.cloudflare.com/profile/api-tokens
    pause
    exit /b 1
)

echo ============================================
echo  TukTuk Workers — Phase 2 Setup
echo  Account: %CLOUDFLARE_ACCOUNT_ID%
echo ============================================

cd /d "%~dp0workers"

echo.
echo [1/6] Installing dependencies (Hono.js)...
call npm install
if ERRORLEVEL 1 (echo [ERROR] npm install ล้มเหลว && pause && exit /b 1)

echo.
echo [2/6] Creating D1 Database...
echo (ถ้ามีแล้วจะ skip อัตโนมัติ)
call npx wrangler@3 d1 create tuktukfeed-db 2>&1
echo.
echo *** คัดลอก database_id ที่ได้ มาใส่ใน workers\wrangler.toml บรรทัด database_id ***
echo *** แล้วกด Enter เพื่อดำเนินการต่อ ***
pause

echo.
echo [3/6] Creating D1 Schema (Tables)...
call npx wrangler@3 d1 execute tuktukfeed-db --file=migrations/001_init.sql --remote
if ERRORLEVEL 1 (echo [ERROR] Schema migration ล้มเหลว && pause && exit /b 1)
echo [OK] Tables created successfully

echo.
echo [4/6] Creating KV Namespace (Sessions)...
call npx wrangler@3 kv:namespace create SESSIONS 2>&1
echo.
echo *** คัดลอก KV id ที่ได้ มาใส่ใน workers\wrangler.toml บรรทัด id (ใต้ binding = "SESSIONS") ***
echo *** แล้วกด Enter เพื่อดำเนินการต่อ ***
pause

echo.
echo [5/6] Setting Secrets...
echo Setting JWT_SECRET...
echo tuktuk-secret-2026-super-secure-key-change-this | call npx wrangler@3 secret put JWT_SECRET

echo Setting R2_ACCESS_KEY_ID...
echo %R2_ACCESS_KEY% | call npx wrangler@3 secret put R2_ACCESS_KEY_ID

echo Setting R2_SECRET_ACCESS_KEY...
echo %R2_SECRET_KEY% | call npx wrangler@3 secret put R2_SECRET_ACCESS_KEY

echo Setting GEMINI_API_KEY...
echo %GOOGLE_API_KEY% | call npx wrangler@3 secret put GEMINI_API_KEY

echo.
echo [6/6] Deploying Workers...
call npx wrangler@3 deploy
if ERRORLEVEL 1 (echo [ERROR] Deploy ล้มเหลว && pause && exit /b 1)

echo.
echo ============================================
echo  Workers Deploy สำเร็จ!
echo ============================================
echo.
echo Workers URL: https://tuktukfeed-api.%CLOUDFLARE_ACCOUNT_ID%.workers.dev
echo.
echo Next steps:
echo  1. ทดสอบ: curl https://tuktukfeed-api.workers.dev/health
echo  2. อัปเดต public/js/cloudflare-client.js: CF_WORKER_URL
echo  3. Phase 3: ย้ายข้อมูลจาก Firestore (node scripts/migrate-firestore-to-d1.mjs)
echo.
pause
