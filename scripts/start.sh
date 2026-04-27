#!/usr/bin/env bash
# Plantii 전체 기동: DB(docker) + backend + frontend
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$ROOT/logs"
mkdir -p "$LOG_DIR"

echo "[1/3] 🐘 Postgres (docker)..."
docker start plantii-postgres >/dev/null || docker run -d --name plantii-postgres \
  -e POSTGRES_USER=plantii -e POSTGRES_PASSWORD=plantii -e POSTGRES_DB=plantii_dev \
  -p 5432:5432 postgres:16

echo "[2/3] 🧪 Backend (port 3300)..."
(cd "$ROOT/backend" && nohup npm run dev > "$LOG_DIR/backend.log" 2>&1 &)

echo "[3/3] 🎨 Frontend (port 5300)..."
(cd "$ROOT/frontend" && nohup npm run dev > "$LOG_DIR/frontend.log" 2>&1 &)

sleep 3
echo
echo "✅ 기동 완료"
echo "   Backend : http://localhost:3300  (logs: logs/backend.log)"
echo "   Frontend: http://localhost:5300  (logs: logs/frontend.log)"
echo "   종료   : scripts/stop.sh"
