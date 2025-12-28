# Leap Dashboard Studio - Startup Script
# Run this script to start the development server

$projectRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))

Write-Host "Starting Leap Dashboard Studio..." -ForegroundColor Cyan
Write-Host "Project: $projectRoot" -ForegroundColor Gray

Set-Location $projectRoot

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start the development server
Write-Host "Starting dev server on http://localhost:3019" -ForegroundColor Green
npm run dev
