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

## 3분 빠른 시작

필수 조건은 **Docker Desktop**입니다. Docker Desktop을 실행한 뒤 아래 중 하나만 하면 데이터베이스, API, 대시보드가 함께 시작됩니다. 첫 실행은 이미지를 만드는 동안 조금 더 걸릴 수 있습니다.

| 운영체제 | 할 일 | 대시보드 주소 |
| --- | --- | --- |
| Windows | 프로젝트 폴더에서 `start.bat`를 더블클릭합니다. | `http://127.0.0.1:3000` |
| macOS / Linux | 터미널에서 `chmod +x start.sh && ./start.sh`를 실행합니다. | `http://127.0.0.1:3000` |

`start` 스크립트는 `.env`가 없을 때만 `.env.example`을 복사하고, 기존 데이터는 지우지 않습니다. 종료하려면 실행 중인 터미널에서 `Ctrl+C`를 누르세요.

대시보드에 처음 로그인할 때 사용할 기본 계정은 `admin@jarvis.example.com` / `change-me-now`입니다. 로그인 후에는 **상품 후보 찾기 → 수익성 점검 → 판매 준비** 순서로 진행하면 됩니다.

| 주소 | 용도 |
| --- | --- |
| `http://127.0.0.1:3000` | 운영 대시보드 |
| `http://127.0.0.1:8001/docs` | API 문서 (개발자용) |
| `http://127.0.0.1:8001/health` | 서비스 상태 확인 |

> 기존 데이터를 완전히 삭제하고 처음부터 시작하는 작업은 별도 관리 절차입니다. 평소 실행 시에는 `docker compose down -v`를 사용하지 마세요.

## Render 스테이징 배포

루트의 `render.yaml`은 백엔드·프런트엔드·PostgreSQL 스테이징 환경을
Singapore 리전에 구성합니다. 비밀번호는 저장소에 기록하지 않고 Blueprint
생성 화면에서 입력합니다. 무료 PostgreSQL은 30일 후 만료되므로 운영 전환
전에 유료 플랜과 백업 정책을 확정해야 합니다. 자세한 절차는
[`docs/DEPLOY_RENDER.md`](docs/DEPLOY_RENDER.md)를 참조하세요.
