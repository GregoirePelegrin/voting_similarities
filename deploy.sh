#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Use .env.production for deployment, fall back to .env for dev
ENV_FILE=".env.production"
if [ ! -f "$ENV_FILE" ]; then
  ENV_FILE=".env"
fi
echo "=== Using environment file: $ENV_FILE ==="

HTTP_PROXY="${HTTP_PROXY:-}"
HTTPS_PROXY="${HTTPS_PROXY:-}"

BACKEND_ARGS=()
FRONTEND_ARGS=()
if [ -n "$HTTP_PROXY" ]; then
  BACKEND_ARGS+=(--build-arg "PIP_TRUSTED_HOST=files.pythonhosted.org pypi.org")
  FRONTEND_ARGS+=(--build-arg "NPM_CONFIG_PROXY=$HTTP_PROXY")
  FRONTEND_ARGS+=(--build-arg "NODE_TLS_REJECT_UNAUTHORIZED=0")
fi

echo "=== Building backend image ==="
podman build --network host \
  "${BACKEND_ARGS[@]}" \
  -t voting-backend:latest -f backend/Dockerfile .

echo "=== Building frontend image ==="
podman build --network host \
  "${FRONTEND_ARGS[@]}" \
  -t voting-frontend:latest -f frontend/Dockerfile .

echo "=== Stopping existing containers ==="
podman rm -f voting-backend voting-frontend 2>/dev/null || true

echo "=== Starting backend ==="
podman run -d \
  --name voting-backend \
  --network host \
  --env-file "$ENV_FILE" \
  -v ./data:/app/data:Z \
  voting-backend:latest

echo "=== Waiting for backend health ==="
for i in $(seq 1 30); do
  if curl -s http://localhost:8000/api/health >/dev/null 2>&1; then
    echo "Backend is healthy"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "Backend failed to start"
    exit 1
  fi
  sleep 2
done

echo "=== Starting frontend ==="
podman run -d \
  --name voting-frontend \
  --network host \
  voting-frontend:latest

echo "=== Deployed ==="
echo "Frontend: http://localhost:8080"
echo "Backend:  http://localhost:8000"
echo "Docs:     http://localhost:8000/docs"
