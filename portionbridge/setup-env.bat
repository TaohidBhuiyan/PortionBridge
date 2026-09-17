@echo off
echo ========================================
echo PortionBridge Environment Setup
echo ========================================
echo.

echo This script will help you configure your .env file
echo.
echo IMPORTANT: Your current .env file will be preserved
echo Only missing or empty values will be updated
echo.
pause

cd server

if not exist .env (
    echo ERROR: .env file not found!
    echo Please copy .env.example to .env first
    pause
    exit /b 1
)

echo.
echo Current configuration check:
echo.

findstr /B "NODE_ENV PORT CLIENT_URL DB_HOST DB_USER DB_NAME" .env

echo.
echo ========================================
echo Optional Configuration
echo ========================================
echo.
echo The following features require additional setup:
echo.
echo 1. Email Verification (Brevo API)
echo    - Get free API key from https://app.brevo.com/settings/keys/api
echo    - Without this: Email verification auto-bypassed in development
echo.
echo 2. Google OAuth Sign-in
echo    - Get Client ID from https://console.cloud.google.com/apis/credentials
echo    - Without this: Users can only use email/password registration
echo.
echo.

set /p SETUP_EMAIL="Do you want to configure email now? (y/n): "
if /i "%SETUP_EMAIL%"=="y" (
    echo.
    echo Enter your Brevo API Key (or press Enter to skip):
    set /p BREVO_KEY=""
    if not "%BREVO_KEY%"=="" (
        echo Updating BREVO_API_KEY...
        powershell -Command "(Get-Content .env) -replace '^BREVO_API_KEY=.*', 'BREVO_API_KEY=%BREVO_KEY%' | Set-Content .env"
        echo Brevo API Key configured!
    )
)

set /p SETUP_GOOGLE="Do you want to configure Google OAuth now? (y/n): "
if /i "%SETUP_GOOGLE%"=="y" (
    echo.
    echo Enter your Google Client ID (or press Enter to skip):
    set /p GOOGLE_ID=""
    if not "%GOOGLE_ID%"=="" (
        echo Updating GOOGLE_CLIENT_ID...
        powershell -Command "(Get-Content .env) -replace '^GOOGLE_CLIENT_ID=.*', 'GOOGLE_CLIENT_ID=%GOOGLE_ID%' | Set-Content .env"
        echo Google Client ID configured!
    )
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Your .env file has been configured.
echo.
echo Next steps:
echo 1. Make sure MySQL/XAMPP is running
echo 2. Run start.bat to start both servers
echo 3. Open http://localhost:5173 in your browser
echo.
echo For detailed setup instructions, see ENV_SETUP.md
echo.
pause
