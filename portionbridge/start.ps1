# PortionBridge Development Server Startup Script
$root = $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PortionBridge Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Starting Backend Server..." -ForegroundColor Green
$backend = Start-Process -FilePath "cmd" -ArgumentList "/k cd /d `"$root\server`" && npm run dev" -PassThru -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host "Starting Frontend Server..." -ForegroundColor Green
$frontend = Start-Process -FilePath "cmd" -ArgumentList "/k cd /d `"$root\client`" && npm run dev" -PassThru -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Servers Starting!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Yellow
Write-Host "Frontend: http://127.0.0.1:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "Two new windows should have opened." -ForegroundColor White
Write-Host "Keep those windows open while you work." -ForegroundColor White
Write-Host ""
Write-Host "Opening browser in 5 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Start-Process "http://127.0.0.1:5173"

Write-Host ""
Write-Host "Done! Close this window when you're done working." -ForegroundColor Green
Read-Host "Press Enter to exit and stop servers"

# Stop servers when this script is closed
Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue
Write-Host "Servers stopped." -ForegroundColor Yellow
