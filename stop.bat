@echo off
title JanSevak Stop All
echo Stopping all JanSevak services and freeing ports 3000, 8000, 8001...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports = @(3000, 8000, 8001); foreach ($p in $ports) { $conn = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue; if ($conn) { $conn.OwningProcess | Select-Object -Unique | ForEach-Object { if ($_ -gt 0) { Write-Host \"Stopping PID $_ on port $p...\"; Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } } } }; Write-Host 'All ports freed cleanly.' -ForegroundColor Green"
pause
