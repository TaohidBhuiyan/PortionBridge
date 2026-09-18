@echo off
setlocal
set "ROOT=%~dp0"
echo Starting PortionBridge Servers...
echo Killing existing Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo Installing dependencies if needed...
cd /d "%ROOT%server"
if not exist node_modules (
    echo Installing server dependencies...
    call npm install
)

echo Starting Backend Server...
start "PortionBridge Backend" /D "%ROOT%server" cmd /k npm run dev

timeout /t 4 /nobreak >nul

cd /d "%ROOT%client"
if not exist node_modules (
    echo Installing client dependencies...
    call npm install
)

echo Starting Frontend Server...
start "PortionBridge Frontend" /D "%ROOT%client" cmd /k npm run dev

echo Waiting for frontend to become available...
for /l %%i in (1,1,15) do (
    powershell -NoProfile -Command "try { $tcp = New-Object System.Net.Sockets.TcpClient; $tcp.Connect('127.0.0.1',5173); $tcp.Close(); exit 0 } catch { exit 1 }" >nul 2>&1
    if not errorlevel 1 goto frontend_ready
    timeout /t 1 /nobreak >nul
)

echo ERROR: Frontend did not start on port 5173.
echo Check the PortionBridge Frontend window for the startup error.
pause
exit /b 1

:frontend_ready

echo Servers started successfully!
echo Backend: http://localhost:5000
echo Frontend: http://127.0.0.1:5173
echo.
echo Opening browser...
start http://127.0.0.1:5173
