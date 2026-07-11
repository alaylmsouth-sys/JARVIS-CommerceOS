# Architecture

## 핵심 원칙

- AI 소싱을 첫 번째 제품으로 개발
- 각 마켓플레이스는 Adapter로 분리
- 중요한 실행은 사용자 승인 후 수행
- 비즈니스 데이터는 PostgreSQL
- 임시 작업과 큐는 Redis
- 향후 AI Memory는 별도 Vector DB로 확장
- 기능별 페이지 전환형 탭 UI

## 1차 모듈

1. AI Sourcing Center
2. Marketplace Adapter
3. Scoring Engine
4. Approval Workflow
5. Dashboard

## 지원 예정 시장

- 한국: 쿠팡, 네이버
- 미국: Amazon, Walmart, eBay, Shopify
- 동남아: Shopee, Lazada, TikTok Shop
