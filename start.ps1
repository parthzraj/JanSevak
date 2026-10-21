# JanSevak (PrajaPulse) Unified Single-Click Launcher
# Automatically cleans stale ports, starts all services, and opens the website.

$ErrorActionPreference = "Continue"

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "   JanSevak (PrajaPulse) Unified Platform Launcher    " -ForegroundColor Yellow
Write-Host "=======================================================`n" -ForegroundColor Cyan

# 1. Free stale ports if any are locked
$ports = @(3000, 8000, 8001)
foreach ($p in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
    if ($conn) {
        $pids = $conn.OwningProcess | Select-Object -Unique
        foreach ($procId in $pids) {
            if ($procId -gt 0) {
                Write-Host "Freeing occupied port $p (PID $procId)..." -ForegroundColor Yellow
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            }
        }
    }
}
Start-Sleep -Milliseconds 500

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 2. Check Ollama
$ollamaRunning = $false
try {
    $oTest = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -Method Get -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($oTest) { $ollamaRunning = $true }
} catch {
    $ollamaRunning = $false
}

# 3. Start AI Service (Port 8001)
if ($ollamaRunning) {
    Write-Host "[1/3] Starting Full AI Service on Port 8001 (Ollama GPU Mode)..." -ForegroundColor Green
    $aiJob = Start-Process -FilePath "$rootDir\backend\ai_service\.venv\Scripts\python.exe" `
        -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port 8001" `
        -WorkingDirectory "$rootDir\backend\ai_service" `
        -PassThru -NoNewWindow
} else {
    Write-Host "[1/3] Ollama not detected. Starting Zero-GPU AI Lite Fallback on Port 8001..." -ForegroundColor Yellow
    $aiJob = Start-Process -FilePath "$rootDir\backend\ai_service\.venv\Scripts\python.exe" `
        -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port 8001" `
        -WorkingDirectory "$rootDir\backend\lite" `
        -PassThru -NoNewWindow
}

# 4. Start Core API (Port 8000)
Write-Host "[2/3] Starting Core API on Port 8000 (Auth, Database, Grievance Engine)..." -ForegroundColor Green
$coreJob = Start-Process -FilePath "$rootDir\backend\core_api\.venv\Scripts\python.exe" `
    -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port 8000" `
    -WorkingDirectory "$rootDir\backend\core_api" `
    -PassThru -NoNewWindow

# 5. Start Frontend Dev Server (Port 3000)
Write-Host "[3/3] Starting Frontend UI on Port 3000..." -ForegroundColor Green
$feJob = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c npm run dev" `
    -WorkingDirectory "$rootDir\frontend" `
    -PassThru -NoNewWindow

# Wait for frontend to respond
Write-Host "`nWaiting for services to become ready..." -ForegroundColor Cyan
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 1
    try {
        $check = Invoke-WebRequest -Uri "http://127.0.0.1:3000/" -Method Head -UseBasicParsing -TimeoutSec 1 -ErrorAction SilentlyContinue
        if ($check.StatusCode -eq 200) { break }
    } catch { }
}

Write-Host "`n-------------------------------------------------------" -ForegroundColor Green
Write-Host " SUCCESS! Everything is live in ONE place:            " -ForegroundColor Green
Write-Host "   URL: http://localhost:3000                          " -ForegroundColor Yellow
Write-Host "-------------------------------------------------------`n" -ForegroundColor Green

# Open browser
Start-Process "http://localhost:3000"

Write-Host "Both your work and her work are running together!" -ForegroundColor Cyan
Write-Host "Press [Enter] at any time to STOP all servers cleanly.`n" -ForegroundColor White

[Console]::ReadLine() | Out-Null

Write-Host "`nStopping all services..." -ForegroundColor Yellow
Stop-Process -Id $coreJob.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $aiJob.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $feJob.Id -Force -ErrorAction SilentlyContinue

# Ensure ports freed
foreach ($p in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
    if ($conn) {
        $conn.OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
    }
}

Write-Host "All services stopped cleanly. Goodbye!`n" -ForegroundColor Green
