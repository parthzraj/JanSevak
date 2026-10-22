# Run on the GPU laptop: start the REAL AI service and give it a public https address for the Render backend to use.
#     powershell -ExecutionPolicy Bypass -File deploy\start_ai_laptop.ps1
# Options:  -Tunnel ngrok   -Domain your-name.ngrok-free.app   (ngrok only: a fixed address)
param(
    [ValidateSet("cloudflared", "ngrok")][string]$Tunnel = "cloudflared",
    [string]$Domain = ""
)
$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
function Say($msg, $color = "Cyan") { Write-Host $msg -ForegroundColor $color }

$aiPy = "$root\backend\ai_service\.venv\Scripts\python.exe"
if (-not (Test-Path $aiPy)) { Say "AI service venv not found. See deploy\DEPLOY.md step 2." Red; exit 1 }
if (-not (Get-Command $Tunnel -ErrorAction SilentlyContinue)) { Say "'$Tunnel' is not installed or not in PATH." Red; exit 1 }
try { Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 3 -ErrorAction Stop | Out-Null }
catch { Say "Ollama is not running. Start Ollama first (and make sure llama3.2:3b and llava are pulled)." Red; exit 1 }

$conn = Get-NetTCPConnection -LocalPort 8001 -ErrorAction SilentlyContinue
if ($conn) { $conn.OwningProcess | Select-Object -Unique | Where-Object { $_ -gt 0 } | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }

Say "Starting the real AI service on 8001" Green
$ai = Start-Process -FilePath $aiPy -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port 8001" -WorkingDirectory "$root\backend\ai_service" -PassThru -NoNewWindow

Say "Opening the tunnel ($Tunnel)" Green
$log = "$env:TEMP\jansevak_ai_tunnel.log"
Remove-Item $log -ErrorAction SilentlyContinue
if ($Tunnel -eq "cloudflared") {
    $tun = Start-Process -FilePath "cloudflared" -ArgumentList "tunnel --url http://127.0.0.1:8001" -RedirectStandardError $log -RedirectStandardOutput "$env:TEMP\jansevak_ai_tunnel_out.log" -PassThru -WindowStyle Hidden
} else {
    $a = if ($Domain) { "http --url=$Domain 8001" } else { "http 8001" }
    $tun = Start-Process -FilePath "ngrok" -ArgumentList $a -RedirectStandardOutput $log -RedirectStandardError "$env:TEMP\jansevak_ai_tunnel_err.log" -PassThru -WindowStyle Hidden
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
    Say " REAL AI ADDRESS:  $url" Yellow
    Say " On Render -> jansevak-api -> Environment, set:" Green
    Say "     REAL_AI_URL = $url" White
    Say " Save (the service restarts). Until then the app uses AI Lite." Green
    Say "-------------------------------------------------------------" Green
    Set-Clipboard -Value $url -ErrorAction SilentlyContinue
} else { Say "Could not read the tunnel address. Look at $log" Red }
Say "`nKeep this window open. Press [Enter] to stop.`n" White
[Console]::ReadLine() | Out-Null
foreach ($proc in @($tun, $ai)) { if ($proc) { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } }
Say "Stopped. The app falls back to AI Lite." Green
