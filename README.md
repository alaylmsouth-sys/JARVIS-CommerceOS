# JARVIS-CommerceOS Foundation v1.0

안정적인 장기 확장을 위한 기반 버전입니다.

## 포함 기능
- FastAPI + PostgreSQL + Redis
- JWT 로그인
- AI Sourcing 후보 등록/조회
- 마진 및 점수 계산
- 승인/거절 워크플로우
- 감사 로그
- Next.js 탭형 대시보드
- Docker Compose 및 GitHub Actions

## 실행
```bash
cp .env.example .env
docker compose down -v
docker compose up --build
```

- Dashboard: http://localhost:3000
- API: http://localhost:8001
- Swagger: http://localhost:8001/docs
- Health: http://localhost:8001/health

기본 로그인: `admin@jarvis.local` / `change-me-now`
