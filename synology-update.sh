#!/bin/sh
# ==============================================================================
# Overload Audio Taunt Maker - Synology NAS Update Script
# Works on Synology DS1515+ and any DSM 7.x / 6.x NAS with Docker / Container Manager
# ==============================================================================

set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo "========================================================"
echo " Updating Overload Audio Taunt Maker on Synology NAS"
echo " Working directory: $DIR"
echo "========================================================"

# Check if git repository
if [ -d ".git" ]; then
    echo "[1/3] Pulling latest commits from GitHub..."
    git pull
else
    echo "[1/3] Directory is not a git repo, skipping git pull..."
fi

# Detect docker-compose vs docker compose
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
else
    echo "ERROR: Neither 'docker compose' nor 'docker-compose' found."
    echo "Please ensure Container Manager or Docker is installed in Synology Package Center."
    exit 1
fi

echo "[2/3] Pulling updated container images / rebuilding..."
$COMPOSE_CMD pull || true
$COMPOSE_CMD up -d --build --remove-orphans

echo "[3/3] Pruning unused image layers to save disk space on NAS..."
docker image prune -f

echo "========================================================"
echo " Overload Audio Taunt Maker updated and running!"
echo " Access the web app at: http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'YOUR_SYNOLOGY_IP'):5173"
echo "========================================================"
