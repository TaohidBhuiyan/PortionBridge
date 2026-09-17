# PortionBridge Development Server Startup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PortionBridge Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "server\package.json")) {
    Write-Host "ERROR: Please run this script from the portionbridge directory" -ForegroundColor Red
    Write-Host "Current directory: $PWD" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Starting Backend Server..." -ForegroundColor Green
$backend = Start-Process -FilePath "cmd" -ArgumentList "/k cd /d $PWD\server && npm run dev" -PassThru -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host "Starting Frontend Server..." -ForegroundColor Green
$frontend = Start-Process -FilePath "cmd" -ArgumentList "/k cd /d $PWD\client && npm run dev" -PassThru -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Servers Starting!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "Two new windows should have opened." -ForegroundColor White
Write-Host "Keep those windows open while you work." -ForegroundColor White
Write-Host ""
Write-Host "Opening browser in 5 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "Done! Close this window when you're done working." -ForegroundColor Green
Read-Host "Press Enter to exit and stop servers"

# Stop servers when this script is closed
Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue
Write-Host "Servers stopped." -ForegroundColor Yellow
