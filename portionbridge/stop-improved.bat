@echo off
echo ========================================
echo Stopping PortionBridge Servers
echo ========================================
echo.

echo Stopping Node.js processes related to PortionBridge...
taskkill /F /IM node.exe >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo Successfully stopped Node.js processes
) else (
    echo No Node.js processes found running
)

echo.
echo All servers should be stopped now.
echo.
pause
