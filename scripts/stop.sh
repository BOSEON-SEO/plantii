#!/usr/bin/env bash
# Plantii 전체 종료: backend + frontend + DB 컨테이너
echo "🛑 포트 3300/5300/5301 프로세스 kill..."
for PORT in 3300 5300 5301; do
  PIDS=$(netstat -ano 2>/dev/null | grep ":$PORT.*LISTENING" | awk '{print $5}' | sort -u)
  for PID in $PIDS; do
    [ -n "$PID" ] && taskkill //PID "$PID" //F >/dev/null 2>&1 && echo "  killed PID $PID ($PORT)"
  done
done

echo "🐘 Postgres 컨테이너 정지..."
docker stop plantii-postgres >/dev/null 2>&1 && echo "  stopped plantii-postgres"

echo "✅ 종료 완료"
