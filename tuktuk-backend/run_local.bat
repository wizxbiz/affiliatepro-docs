@echo off
chcp 65001 >nul
:: Always run from this script's own directory (tuktuk-backend/)
cd /d "%~dp0"

echo =========================================
echo  TukTuk Go Engine - Local Dev
echo =========================================

:: 1. Check Go is installed
go version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Go is NOT installed.
    echo         Download: https://go.dev/dl/
    pause
    exit /b 1
)
for /f "tokens=3" %%v in ('go version') do echo [OK] Go %%v

:: 2. Load .env file into environment
if exist .env (
    echo [INFO] Loading .env ...
    for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env") do (
        if not "%%A"=="" set "%%A=%%B"
    )
    echo [OK]  .env loaded
) else (
    echo [WARN] .env not found - R2 upload will be disabled
)

:: 3. Set dev defaults
if "%GIN_MODE%"==""  set GIN_MODE=debug
if "%PORT%"==""      set PORT=8080

echo [INFO] Mode=%GIN_MODE%  Port=%PORT%
echo -----------------------------------------

:: 4. Tidy dependencies
echo [1/3] go mod tidy ...
go mod tidy
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] go mod tidy failed
    pause
    exit /b 1
)

:: 5. Build
echo [2/3] Building tuktuk-engine.exe ...
go build -o tuktuk-engine.exe .
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed - check errors above
    pause
    exit /b 1
)
echo [OK]  Build successful

:: 6. Run
echo [3/3] Running at http://localhost:%PORT%
echo       Press Ctrl+C to stop
echo -----------------------------------------
tuktuk-engine.exe

pause
