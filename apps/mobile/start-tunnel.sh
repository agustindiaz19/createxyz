#!/bin/bash

# Function to get ngrok URL
function get_ngrok_url() {
    response=$(curl -s "http://127.0.0.1:4040/api/tunnels" || true)
    ngrok_url=$(echo "$response" | grep -o '"public_url": "[^"]*"' | head -1 | cut -d'"' -f4)
    echo "$ngrok_url"
}

# Function to stop ngrok
function stop_ngrok() {
    echo "Deteniendo ngrok..."
    ngrok stop --all 2>/dev/null
    pkill ngrok 2>/dev/null
}

# Setup trap to cleanup on exit
trap stop_ngrok EXIT

# Check if ngrok is already running
ngrok_url=""
if [ -z "$NGROK_URL" ]; then
    echo "Iniciando ngrok tunnel..."
    # Start ngrok in the background
    ngrok http 8081 --host-header=localhost > /dev/null 2>&1 &
    pid=$!

    echo "Esperando a que ngrok inicie..."
    sleep 4

    url=""
    for i in {1..15}; do
        url=$(get_ngrok_url)
        if [ -n "$url" ]; then
            break
        fi
        sleep 1
    done

    if [ -z "$url" ]; then
        echo "Error: No se pudo obtener la URL de ngrok."
        echo "Asegúrate de tener ngrok autenticado: ngrok config add-authtoken <token>"
        echo "o visita https://dashboard.ngrok.com/get-started/your-authtoken"
        stop_ngrok
        exit 1
    fi
else
    url="$NGROK_URL"
fi

echo "══════════════════════════════════════════════"
echo "  ngrok URL: $url"
echo "  Expo Go:   exp://$url"
echo "══════════════════════════════════════════════"

export EXPO_PACKAGER_PROXY_URL="$url"

echo "Iniciando Expo con EXPO_PACKAGER_PROXY_URL=$url"
echo ""
echo "Abre Expo Go y escanea el QR o usa:"
echo "  exp://$url"
echo ""
echo "Presiona Ctrl+C para detener todo."

# Run expo (ngrok tunnel is already managed by this script)
npx expo start --host lan

stop_ngrok
