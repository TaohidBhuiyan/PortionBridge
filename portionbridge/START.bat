@echo off
echo Starting PortionBridge Servers...
echo Killing existing Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo Installing dependencies if needed...
cd /d "%~dp0server"
if not exist node_modules (
    echo Installing server dependencies...
    call npm install
)

echo Starting Backend Server...
start "PortionBridge Backend" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul

cd /d "%~dp0client"
if not exist node_modules (
    echo Installing client dependencies...
    call npm install
)

echo Starting Frontend Server...
start "PortionBridge Frontend" cmd /k "npm run dev"

timeout /t 5 /nobreak >nul

echo Servers started successfully!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Opening browser...
start http://localhost:5173
