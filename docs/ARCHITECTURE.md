# Architecture v0.2
Browser → Next.js → 내부 API Proxy → FastAPI → PostgreSQL 구조입니다.
PostgreSQL과 Redis는 외부 포트를 열지 않습니다. 중요한 실행은 사용자 승인 후 수행합니다.
