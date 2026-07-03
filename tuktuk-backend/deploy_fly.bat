@echo off
chcp 65001 >nul
:: Always run from this script's own directory (tuktuk-backend/)
cd /d "%~dp0"

echo =========================================
echo  TukTuk Go Engine - Deploy to Fly.io
echo =========================================

:: 1. Verify fly.toml exists
if not exist fly.toml (
    echo [ERROR] fly.toml not found.
    echo         Run this script from the tuktuk-backend/ directory.
    pause
    exit /b 1
)

:: 2. Detect Fly CLI  (new: "fly",  old: "flyctl")
set FLY=fly
fly version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    set FLY=flyctl
    flyctl version >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Fly CLI not found.
        echo         Install: https://fly.io/docs/flyctl/install/
        pause
        exit /b 1
    )
)
for /f "tokens=*" %%v in ('%FLY% version 2^>nul') do (echo [OK]  %%v & goto :fly_ok)
:fly_ok

:: 3. Check login
%FLY% auth whoami >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Not logged in - opening browser for login...
    %FLY% auth login
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Login failed
        pause
        exit /b 1
    )
)
for /f "tokens=*" %%u in ('%FLY% auth whoami 2^>nul') do echo [OK]  Logged in as: %%u

:: 4. Push secrets from .env to Fly.io (one-time setup / update)
if exist .env (
    echo [INFO] Pushing secrets from .env to Fly.io ...
    for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env") do (
        if not "%%A"=="" (
            echo       %%A
            %FLY% secrets set "%%A=%%B" --app tuktuk-engine >nul 2>&1
        )
    )
    echo [OK]  Secrets updated
) else (
    echo [WARN] .env not found - skipping secrets push
    echo        Set manually: %FLY% secrets set R2_ACCESS_KEY_ID=xxx R2_SECRET_ACCESS_KEY=yyy
)

:: 5. Firebase credentials — serviceAccountKey.json is baked into the Docker image via Dockerfile
::    (COPY --from=builder /app/serviceAccountKey.json* ./)
::    No need to push it as a secret. Just ensure the file exists before deploying.
if not exist serviceAccountKey.json (
    echo [WARN] serviceAccountKey.json not found.
    echo        Firestore will be disabled. App runs in demo mode.
)

:: 6. Deploy
echo.
echo [Deploying...] This may take 2-5 minutes ...
%FLY% deploy --remote-only
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Deployment failed.
    echo         View logs: %FLY% logs --app tuktuk-engine
    pause
    exit /b 1
)

echo.
echo =========================================
echo  Deployment SUCCESSFUL!
echo  Live:   https://tuktuk-engine.fly.dev
echo  Logs:   %FLY% logs --app tuktuk-engine
echo  Status: %FLY% status --app tuktuk-engine
echo =========================================
pause
