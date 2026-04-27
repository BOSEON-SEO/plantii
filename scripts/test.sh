#!/usr/bin/env bash
# Plantii 백엔드 통합/유닛 테스트 일괄 실행
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "🐘 Postgres 준비 확인..."
docker start plantii-postgres >/dev/null 2>&1 || true
sleep 1

echo "🧪 Backend tests..."
(cd "$ROOT/backend" && npm test)
