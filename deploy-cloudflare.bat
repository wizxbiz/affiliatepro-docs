@echo off
REM =============================================================
REM TukTuk Social — Cloudflare Deploy Script
REM Phase 1: Cloudflare Pages Hosting
REM =============================================================
REM
REM BEFORE RUNNING:
REM   ใส่ Token ที่ได้จาก https://dash.cloudflare.com/profile/api-tokens
REM   Template: "Edit Cloudflare Workers" + เพิ่ม Pages:Edit, D1:Edit, R2:Edit
REM

SET CLOUDFLARE_API_TOKEN=YOUR_NEW_TOKEN_HERE
SET CLOUDFLARE_ACCOUNT_ID=3936ddcbff711649ab56a10375e82b67

IF "%CLOUDFLARE_API_TOKEN%"=="YOUR_NEW_TOKEN_HERE" (
    echo [ERROR] กรุณาตั้งค่า CLOUDFLARE_API_TOKEN ก่อน
    echo.
    echo วิธีรับ API Token ใหม่:
    echo   1. ไปที่ https://dash.cloudflare.com/profile/api-tokens
    echo   2. กด "+ Create Token"
    echo   3. เลือก Template: "Edit Cloudflare Workers"
    echo   4. เพิ่ม Permission: Pages:Edit, D1:Edit, Workers R2 Storage:Edit
    echo   5. กด "Continue to summary" แล้ว "Create Token"
    echo   6. คัดลอก token และใส่ใน บรรทัด SET CLOUDFLARE_API_TOKEN ของไฟล์นี้
    echo.
    pause
    exit /b 1
)

echo ============================================
echo  TukTuk Social — Cloudflare Pages Deploy
echo ============================================
echo.
echo [1/3] Checking wrangler...
call npx wrangler@3 --version

echo.
echo [2/3] Deploying public/ to Cloudflare Pages...
cd public
call npx wrangler@3 pages deploy . --project-name=tuktukfeed --commit-dirty=true
cd ..

if ERRORLEVEL 1 (
    echo.
    echo [INFO] ถ้าเป็น project ใหม่ กรุณาสร้างก่อน:
    echo   call npx wrangler@3 pages project create tuktukfeed
    echo.
    pause
    exit /b 1
)

echo.
echo [3/3] Deploy สำเร็จ!
echo.
echo Next steps:
echo   - ตั้งค่า Custom Domain ใน Cloudflare Pages Dashboard
echo   - ทดสอบ URL ที่ได้จาก deploy
echo   - Phase 2: ติดตั้ง Workers (cd workers ^&^& npm install ^&^& npm run deploy)
echo.
pause
