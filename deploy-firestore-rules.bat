@echo off
echo ========================================
echo   Deploying Firestore Security Rules
echo ========================================
echo.

:: Check if firebase-tools is installed
where firebase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Firebase CLI is not installed!
    echo.
    echo Please install it first:
    echo   npm install -g firebase-tools
    echo.
    pause
    exit /b 1
)

:: Login check
echo [1/3] Checking Firebase authentication...
call firebase projects:list >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Not logged in. Logging in now...
    call firebase login
)

echo.
echo [2/3] Deploying Firestore Rules...
call firebase deploy --only firestore:rules --project appinjproject

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   ✅ Rules deployed successfully!
    echo ========================================
    echo.
    echo Next steps:
    echo   1. Check Firebase Console to verify rules
    echo   2. Add 'adminRole: super_admin' to /users/{uid}
    echo   3. Logout and login again in the app
    echo   4. Test sending messages in Super Admin Chat
    echo.
) else (
    echo.
    echo ========================================
    echo   ❌ Deployment failed!
    echo ========================================
    echo.
    echo Please check:
    echo   1. Firebase project ID is correct
    echo   2. You have permission to deploy
    echo   3. firestore.rules file exists
    echo.
)

echo [3/3] Opening Firebase Console...
start https://console.firebase.google.com/project/appinjproject/firestore/rules

pause
