#!/usr/bin/env bash
# JARVIS CommerceOS 간편 실행기 — Docker Compose로 모든 서비스를 함께 시작합니다.
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker Desktop 또는 Docker Engine이 필요합니다. 설치 후 다시 실행하세요."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose v2가 필요합니다. Docker를 최신 버전으로 업데이트한 뒤 다시 실행하세요."
  exit 1
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "[안내] .env 파일을 만들었습니다. 기본 로그인 정보는 README의 '빠른 시작'에서 확인할 수 있습니다."
fi

echo "JARVIS CommerceOS를 시작합니다. 최초 실행은 이미지를 만드는 동안 조금 더 걸릴 수 있습니다."
echo "브라우저에서 http://127.0.0.1:3000 을 여세요. 종료하려면 Ctrl+C를 누르세요."
exec docker compose up --build
