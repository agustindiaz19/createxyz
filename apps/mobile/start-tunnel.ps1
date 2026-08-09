param(
    [string]$NgrokUrl = $null
)

function Get-NgrokUrl {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -ErrorAction SilentlyContinue
    if ($response.tunnels) {
        return $response.tunnels[0].public_url
    }
    return $null
}

function Stop-Ngrok {
    Write-Host "`nDeteniendo ngrok..." -ForegroundColor Yellow
    ngrok stop --all 2>$null
    $procs = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue
    if ($procs) { $procs | Stop-Process -Force }
}

trap {
    Stop-Ngrok
    exit
}

if (-not $NgrokUrl) {
    Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║           Iniciando ngrok tunnel...                ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan

    $null = Start-Process -FilePath "cmd.exe" -ArgumentList "/c start /MIN ngrok http 8081 --host-header=localhost" -WindowStyle Hidden

    Write-Host "Esperando a que ngrok inicie..." -ForegroundColor Yellow
    Start-Sleep -Seconds 4

    $url = $null
    for ($i = 0; $i -lt 15; $i++) {
        $url = Get-NgrokUrl
        if ($url) { break }
        Start-Sleep -Seconds 1
    }

    if (-not $url) {
        Write-Host "Error: No se pudo obtener la URL de ngrok." -ForegroundColor Red
        Write-Host "Asegúrate de tener ngrok autenticado: ngrok config add-authtoken <token>" - ForegroundColor Yellow
        Write-Host "o visita https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor Yellow
        trap { break }
        Stop-Ngrok
        exit 1
    }
} else {
$url = $NgrokUrl
}

Write-Host "`n══════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ngrok URL: $url" -ForegroundColor Green
Write-Host "  Expo Go:   exp://$($url -replace 'https?://',''):80" -ForegroundColor Green
Write-Host "══════════════════════════════════════════════`n" -ForegroundColor Green

$env:EXPO_PACKAGER_PROXY_URL = $url

Write-Host "Iniciando Expo con EXPO_PACKAGER_PROXY_URL=$url" -ForegroundColor Cyan
Write-Host "`nAbre Expo Go y escanea el QR o usa:" -ForegroundColor Yellow
Write-Host "  exp://$($url -replace 'https?://',''):80" -ForegroundColor White
Write-Host "`nPresiona Ctrl+C para detener todo.`n" -ForegroundColor Yellow

npx expo start --host lan

Stop-Ngrok
