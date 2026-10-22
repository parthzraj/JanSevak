# JanSevak: start the whole backend and give it ONE public https address (for the hackathon demo).
# Run on the laptop that has Ollama.  From the repo root:
#     powershell -ExecutionPolicy Bypass -File deploy\start_public.ps1
# Options:
#     -Seed                load the demo data first (WIPES the database)
#     -Tunnel ngrok        use ngrok instead of cloudflared
#     -Domain  your-name.ngrok-free.app    (ngrok only) a fixed address, so the link never changes
param(
    [switch]$Seed,
    [ValidateSet("cloudflared", "ngrok")][string]$Tunnel = "cloudflared",
    [string]$Domain = ""
)
$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
$core = "$root\backend\core_api"
$corePy = "$core\.venv\Scripts\python.exe"
$ports = @(8000, 8001, 9000)

function Say($msg, $color = "Cyan") { Write-Host $msg -ForegroundColor $color }

# 0. Checks
if (-not (Test-Path $corePy)) { Say "Core API venv not found. Do the setup in deploy\DEPLOY.md (step 2) first." Red; exit 1 }
if (-not (Get-Command $Tunnel -ErrorAction SilentlyContinue)) { Say "'$Tunnel' is not installed or not in PATH. See deploy\DEPLOY.md (step 3)." Red; exit 1 }

# 1. Free stale ports
foreach ($p in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
    if ($conn) { $conn.OwningProcess | Select-Object -Unique | Where-Object { $_ -gt 0 } | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }
}
Start-Sleep -Milliseconds 500

# 2. Optional: demo data
if ($Seed) {
    Say "Loading demo data (this wipes the database)..." Yellow
    Push-Location $core
    & $corePy demo_data.py --reset
    Pop-Location
}

# 3. AI service: the real one if Ollama is running, otherwise the no-GPU Lite one
$ollama = $false
try { if (Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 2 -ErrorAction Stop) { $ollama = $true } } catch { }
$aiPy = "$root\backend\ai_service\.venv\Scripts\python.exe"
if ($ollama) {
    Say "[1/4] Ollama found: starting the real AI service on 8001" Green
    $ai = Start-Process -FilePath $aiPy -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port 8001" -WorkingDirectory "$root\backend\ai_service" -PassThru -NoNewWindow
} else {
    Say "[1/4] Ollama NOT running: starting AI Lite (template answers) on 8001" Yellow
    $ai = Start-Process -FilePath $aiPy -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port 8001" -WorkingDirectory "$root\backend\lite" -PassThru -NoNewWindow
}

# 4. Core API (reads SECRET_KEY, CORS_ORIGINS ... from backend\core_api\.env)
Say "[2/4] Starting the Core API on 8000" Green
$api = Start-Process -FilePath $corePy -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port 8000" -WorkingDirectory $core -PassThru -NoNewWindow

# 5. Gateway: one port for both
Say "[3/4] Starting the gateway on 9000" Green
$gw = Start-Process -FilePath $corePy -ArgumentList "`"$root\deploy\gateway.py`"" -WorkingDirectory $core -PassThru -NoNewWindow

# 6. Tunnel
Say "[4/4] Opening the public tunnel ($Tunnel)" Green
$log = "$env:TEMP\jansevak_tunnel.log"
Remove-Item $log -ErrorAction SilentlyContinue
if ($Tunnel -eq "cloudflared") {
    $tun = Start-Process -FilePath "cloudflared" -ArgumentList "tunnel --url http://127.0.0.1:9000" -RedirectStandardError $log -RedirectStandardOutput "$env:TEMP\jansevak_tunnel_out.log" -PassThru -WindowStyle Hidden
} else {
    $args2 = if ($Domain) { "http --url=$Domain 9000" } else { "http 9000" }
    $tun = Start-Process -FilePath "ngrok" -ArgumentList $args2 -RedirectStandardOutput $log -RedirectStandardError "$env:TEMP\jansevak_tunnel_err.log" -PassThru -WindowStyle Hidden
}

$url = ""
if ($Tunnel -eq "ngrok" -and $Domain) { $url = "https://$Domain" }
for ($i = 0; $i -lt 40 -and -not $url; $i++) {
    Start-Sleep -Seconds 1
    if ($Tunnel -eq "cloudflared" -and (Test-Path $log)) {
        try {
            $m = Select-String -Path $log -Pattern "https://[a-z0-9-]+\.trycloudflare\.com" -ErrorAction Stop | Select-Object -First 1
            if ($m) { $url = $m.Matches[0].Value }
        } catch { }
    } elseif ($Tunnel -eq "ngrok") {
        try { $url = (Invoke-RestMethod "http://127.0.0.1:4040/api/tunnels").tunnels[0].public_url } catch { }
    }
}

Write-Host ""
if ($url) {
    Say "-------------------------------------------------------------" Green
    Say " PUBLIC BACKEND ADDRESS:  $url" Yellow
    Say " In Vercel set BOTH variables to exactly this (no slash at the end):" Green
    Say "     VITE_API_URL     = $url" White
    Say "     VITE_AI_API_URL  = $url" White
    Say " Then redeploy the frontend if the address is different from last time." Green
    Say "-------------------------------------------------------------" Green
    Set-Clipboard -Value $url -ErrorAction SilentlyContinue
    Say "(address copied to the clipboard)" Cyan
} else {
    Say "Could not read the tunnel address. Look at $log" Red
}
Say "`nKeep this window open. Press [Enter] to stop everything.`n" White
[Console]::ReadLine() | Out-Null

foreach ($proc in @($tun, $gw, $api, $ai)) { if ($proc) { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } }
foreach ($p in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
    if ($conn) { $conn.OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }
}
Say "Stopped." Green
