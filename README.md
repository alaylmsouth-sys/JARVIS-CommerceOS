# JARVIS-CommerceOS v1.3.2

안정적인 장기 확장을 위한 기반 버전입니다.

## 포함 기능
- FastAPI + PostgreSQL + Redis
- JWT 로그인
- AI Sourcing 후보 등록/조회
- 마진 및 점수 계산
- 승인/거절 워크플로우
- 프로젝트 생성 및 소싱 후보 연결
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

기본 로그인: `admin@jarvis.example.com` / `change-me-now`

## Render 스테이징 배포

루트의 `render.yaml`은 백엔드·프런트엔드·PostgreSQL 스테이징 환경을
Singapore 리전에 구성합니다. 비밀번호는 저장소에 기록하지 않고 Blueprint
생성 화면에서 입력합니다. 무료 PostgreSQL은 30일 후 만료되므로 운영 전환
전에 유료 플랜과 백업 정책을 확정해야 합니다. 자세한 절차는
[`docs/DEPLOY_RENDER.md`](docs/DEPLOY_RENDER.md)를 참조하세요.
