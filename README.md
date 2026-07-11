# JARVIS-CommerceOS v0.2.0

AI Sourcing Center MVP입니다.

## 포함 기능
- 관리자 로그인(JWT)
- 상품 후보 등록 및 PostgreSQL 저장
- 마진·경쟁·트렌드·브랜드 점수 계산
- AI 추천 설명
- 승인·거절
- 탭 전환형 대시보드
- 쿠팡·네이버·Amazon·Shopee·Lazada 확장용 Adapter 골격

## 실행
```bash
cp .env.example .env
docker compose down
docker compose up --build
```

- Dashboard: Codespaces 포트 `3000`
- API: Codespaces 포트 `8001`
- API 문서: `8001/docs`

기본 로그인: `admin@jarvis.local` / `change-me-now`
