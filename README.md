# JARVIS-CommerceOS

AI 기반 글로벌 커머스 운영체제의 첫 번째 MVP입니다.

## v0.1.0 목표

- AI 소싱 후보 등록 및 조회
- 상품별 기본 점수 계산
- 승인 대기 상태 관리
- 쿠팡, 네이버, Amazon, Shopee 확장을 위한 Marketplace Adapter 골격
- 탭 기반 대시보드 골격
- Docker Compose 기반 로컬 실행

## 구조

```text
backend/     FastAPI API
frontend/    Next.js 대시보드 골격
docs/        아키텍처 및 로드맵
```

## 빠른 시작

### 1. 환경 파일

```bash
cp .env.example .env
```

### 2. Docker 실행

```bash
docker compose up --build
```

### 3. 접속

- API: http://localhost:8000
- API 문서: http://localhost:8000/docs
- Dashboard: http://localhost:3000

## MVP 우선순위

1. AI Sourcing
2. 상품 점수 및 마진 분석
3. 승인 워크플로우
4. 쿠팡/네이버 Adapter
5. 미국/동남아 Adapter
