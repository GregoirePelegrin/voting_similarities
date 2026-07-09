#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

ENV_FILE=".env.production"
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found. Create it from the template in deployment-steps.md"
  exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

echo "=== 1. Ensure PostgreSQL container ==="
if ! podman container exists parliament_analysis_postgres; then
  echo "Starting PostgreSQL..."
  podman run -d \
    --name parliament_analysis_postgres \
    --network host \
    -e POSTGRES_PASSWORD="${DB_PASSWORD}" \
    -e POSTGRES_DB=voting_similarities \
    -v pgdata:/var/lib/postgresql/data:Z \
    docker.io/postgres:16
  echo "Waiting for PostgreSQL to be ready..."
  sleep 5
  for i in $(seq 1 20); do
    if podman exec parliament_analysis_postgres pg_isready -U postgres >/dev/null 2>&1; then
      echo "PostgreSQL is ready"
      break
    fi
    sleep 2
  done
else
  echo "PostgreSQL already running"
fi

echo "=== 2. Build backend image ==="
podman build --network host \
  -t voting-backend:latest -f backend/Dockerfile .

echo "=== 3. Build frontend image with VITE_API_URL ==="
podman build --network host \
  --build-arg "VITE_API_URL=$VITE_API_URL" \
  -t voting-frontend:latest -f frontend/Dockerfile .

echo "=== 4. Stop existing containers ==="
podman rm -f voting-backend voting-frontend voting-caddy 2>/dev/null || true

echo "=== 5. Start backend ==="
podman run -d \
  --name voting-backend \
  --network host \
  --env-file "$ENV_FILE" \
  -v ./data:/app/data:Z \
  voting-backend:latest

echo "=== 6. Wait for backend health ==="
for i in $(seq 1 30); do
  if curl -s http://localhost:8000/api/health >/dev/null 2>&1; then
    echo "Backend is healthy"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "Backend failed to start"
    podman logs voting-backend --tail 20
    exit 1
  fi
  sleep 2
done

echo "=== 7. Start frontend (Nginx) ==="
podman run -d \
  --name voting-frontend \
  --network host \
  voting-frontend:latest

echo "=== 8. Start Caddy reverse proxy ==="
podman run -d \
  --name voting-caddy \
  --network host \
  -v ./Caddyfile:/etc/caddy/Caddyfile:Z \
  -v caddy_data:/data:Z \
  docker.io/caddy:2

echo "=== 9. Verify Caddy is serving ==="
for i in $(seq 1 10); do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost/ | grep -q "200\|301\|302"; then
    echo "Caddy is serving"
    break
  fi
  sleep 2
done

echo ""
echo "=== Deployed ==="
echo "Frontend: https://$VITE_API_URL"
echo "Backend:  http://localhost:8000"
echo "Docs:     http://localhost:8000/docs"
echo ""
echo "NOTE: DNS may take a few minutes to propagate."
echo "If SSL certs are not ready yet, Caddy will serve HTTP first."
