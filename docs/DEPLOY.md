# JARVIS-CommerceOS 프로덕션 배포 가이드

이 문서는 **JARVIS-CommerceOS**를 Render 또는 Docker Compose 기반 서버에 배포하는 운영 절차를 설명합니다. 애플리케이션은 배포 시 `ENVIRONMENT=production`을 강제하고, PostgreSQL 연결·32자 이상의 JWT 비밀값·12자 이상의 관리자 암호를 검증합니다. 따라서 예제 값이나 SQLite 데이터베이스로는 프로덕션 기동이 의도적으로 차단됩니다.

> **안전 원칙:** `.env`, 배포 훅 URL, API 키, 관리자 암호는 저장소에 커밋하지 마십시오. Render Blueprint에서는 `sync: false`로 선언한 값을 대시보드에서 입력하며, GitHub Actions에서는 암호화된 저장소 시크릿만 사용합니다.[1]

| 배포 방식 | 권장 대상 | 기본 배포 흐름 | 마이그레이션 처리 |
|---|---|---|---|
| **Render Blueprint** | 관리형 PostgreSQL과 간단한 운영을 원하는 팀 | `main`의 모든 CI 검사 성공 후 Render 자동 배포 | 무료 인스턴스 제약을 고려해 API 시작 직전에 Alembic 실행 |
| **Docker Compose** | 자체 서버와 리버스 프록시를 운영하는 팀 | 검증 후 `docker compose up -d` | 일회성 `migrate` 서비스가 먼저 완료되어야 API 시작 |

## 1. Render 배포

저장소 루트의 `render.yaml`은 싱가포르 리전에 API, Next.js 웹 서비스, PostgreSQL 데이터베이스를 정의합니다. API는 준비 상태 엔드포인트(`/health/ready`)가 데이터베이스에 `SELECT 1`을 실행할 수 있을 때만 준비된 것으로 응답합니다. Render의 `checksPass` 자동 배포는 연결된 브랜치의 모든 CI 체크가 성공한 경우에만 새 배포를 시작합니다.[2]

### 1.1 최초 생성

Render Dashboard에서 **New + → Blueprint**를 선택하고 `alaylmsouth-sys/JARVIS-CommerceOS` 저장소와 `main` 브랜치를 연결합니다. `render.yaml`을 인식하면 `jarvis-commerceos-staging-api`, `jarvis-commerceos-staging-web`, `jarvis-commerceos-staging-db` 리소스가 제안됩니다. 생성 전에 아래 값을 입력하십시오.

| 대상 | 변수 | 값 또는 입력 방법 | 필수 여부 |
|---|---|---|---|
| API | `ENVIRONMENT` | `production` | 필수 |
| API | `DATABASE_URL` | Blueprint가 관리형 PostgreSQL 연결 문자열을 자동 주입 | 필수 |
| API | `JWT_SECRET` | Blueprint가 안전한 임의 값 자동 생성 | 필수 |
| API | `DEFAULT_ADMIN_EMAIL` | 실제 운영 관리자 이메일 | 필수 |
| API | `DEFAULT_ADMIN_PASSWORD` | 12자 이상, 예제와 다른 고유 암호 | 필수 |
| API | `AI_PROVIDER` | 기본값 `deterministic`; 실제 OpenAI 사용 시 `openai` | 선택 |
| API | `OPENAI_API_KEY` | `AI_PROVIDER=openai`일 때만 대시보드에서 비밀값으로 입력 | 조건부 |
| 웹 | `NEXT_PUBLIC_API_BASE` | `/api/backend` | 자동 설정 |

`DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD`, `OPENAI_API_KEY`는 Blueprint에서 `sync: false`로 선언되어 있으므로 소스 코드에 값이 포함되지 않습니다. Render는 환경 변수를 서비스별로 관리하며, 재배포할 때 저장한 값을 사용합니다.[1]

### 1.2 마이그레이션과 배포 검증

Render의 pre-deploy 명령은 데이터베이스 마이그레이션에 적합하지만, 무료 웹 인스턴스에서는 사용할 수 없습니다.[3] 이 저장소는 무료 플랜에서도 동작하도록 API 서비스의 `dockerCommand`에서 다음 순서로 실행합니다.

```sh
python -m alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
```

Alembic은 이미 적용된 리비전을 다시 적용하지 않으므로, 성공한 배포의 재시작 시에도 최신 리비전 확인만 수행합니다. 배포가 완료되면 다음 주소를 확인하십시오.

```sh
curl --fail https://<api-service>.onrender.com/health
curl --fail https://<api-service>.onrender.com/health/ready
curl --fail https://<web-service>.onrender.com/sourcing
```

첫 번째 엔드포인트는 애플리케이션 프로세스 상태를, 두 번째 엔드포인트는 데이터베이스 연결 가능 여부를 확인합니다. Render는 헬스 체크가 성공한 새 인스턴스로 트래픽을 전환하므로, 준비 상태 검사를 배포 정의에 사용했습니다.[3]

### 1.3 CI/CD와 선택적 배포 훅

`.github/workflows/ci.yml`은 푸시와 풀 리퀘스트마다 백엔드 `pytest`, 프런트엔드 테스트·빌드, 두 Docker 이미지 빌드를 수행합니다. Render Blueprint의 기본값은 `autoDeployTrigger: checksPass`이므로 **일반적으로 GitHub Secrets에 배포 훅을 추가할 필요가 없습니다**.

더 엄격한 외부 오케스트레이션이 필요하면 Render 자동 배포를 `off`로 변경한 뒤에만 배포 훅 방식을 활성화하십시오. 동일한 서비스에 `checksPass`와 배포 훅을 동시에 사용하면 하나의 커밋이 두 번 배포될 수 있습니다. 배포 훅 URL은 배포를 시작할 수 있는 비밀값이며, Render도 신뢰하는 시스템에만 제공하라고 안내합니다.[4]

| GitHub Actions 구성 | 설정 값 | 용도 |
|---|---|---|
| 저장소 변수 | `RENDER_DEPLOY_HOOKS_ENABLED=true` | `deploy` 작업 활성화 |
| 저장소 시크릿 | `RENDER_DEPLOY_HOOK_API` | API 서비스의 Render Deploy Hook URL |
| 저장소 시크릿 | `RENDER_DEPLOY_HOOK_WEB` | 웹 서비스의 Render Deploy Hook URL |

시크릿은 GitHub 저장소의 **Settings → Secrets and variables → Actions**에서 추가합니다. 훅 방식이 활성화되면 `deploy` 작업은 세 CI 작업이 모두 성공하고 `main`에 푸시된 경우에만 두 URL을 호출합니다. URL이 비어 있으면 해당 호출은 건너뛰고 워크플로는 실패하지 않습니다.

## 2. 자체 호스팅 Docker Compose 배포

`docker-compose.prod.yml`은 데이터베이스와 Redis를 내부 네트워크에만 연결하고, 외부 리버스 프록시가 접근하는 `frontend`만 `proxy` 네트워크에 연결합니다. 호스트 포트는 전혀 공개하지 않습니다. 따라서 Caddy, Nginx, Traefik 같은 프록시 컨테이너가 `PROXY_NETWORK`에 이미 연결되어 있어야 합니다.

### 2.1 서버 준비

Docker Engine과 Docker Compose Plugin이 설치된 서버에서 저장소를 복제하고, 운영용 환경 파일을 별도 생성합니다.

```sh
git clone https://github.com/alaylmsouth-sys/JARVIS-CommerceOS.git
cd JARVIS-CommerceOS
cp .env.example .env.production
chmod 600 .env.production
docker network create jarvis-proxy
```

`.env.production`에는 다음 값을 반드시 바꾸십시오. `DATABASE_URL`의 호스트명은 Compose 내부에서는 `db`를 사용합니다.

```dotenv
ENVIRONMENT=production
POSTGRES_DB=jarvis
POSTGRES_USER=jarvis
POSTGRES_PASSWORD=<long-unique-database-password>
DATABASE_URL=postgresql+psycopg://jarvis:<long-unique-database-password>@db:5432/jarvis
REDIS_URL=redis://redis:6379/0
JWT_SECRET=<random-string-with-at-least-32-characters>
DEFAULT_ADMIN_EMAIL=<administrator-email>
DEFAULT_ADMIN_PASSWORD=<unique-password-with-at-least-12-characters>
AI_PROVIDER=deterministic
PROXY_NETWORK=jarvis-proxy
```

실제 OpenAI 연동을 선택할 때만 `AI_PROVIDER=openai`와 `OPENAI_API_KEY`를 함께 설정합니다. 키가 없거나 비어 있으면 앱이 시작 시점에 실패하도록 구성되어 있어 오작동 상태로 배포되지 않습니다.

### 2.2 기동과 확인

```sh
docker compose --env-file .env.production -f docker-compose.prod.yml config --quiet
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=100 migrate backend frontend
```

`migrate` 컨테이너는 성공 후 종료되는 정상 동작입니다. `backend`는 `migrate`가 성공해야 시작하고, `frontend`는 백엔드의 `/health/ready` Docker 헬스 체크가 통과한 뒤 시작합니다. 프록시에서는 `frontend:3000`으로만 라우팅하십시오.

## 3. 운영 점검과 롤백

배포 전에는 `docker compose ... config --quiet`로 변수 대체와 YAML 구조를 확인하고, GitHub Actions의 세 CI 작업이 모두 성공했는지 확인하십시오. 배포 후에는 `/health/ready`와 로그인 화면, 상품 후보 비교, 체크리스트 저장을 확인합니다. 새 배포가 실패하면 Render는 이전에 성공한 서비스 인스턴스를 계속 실행하도록 설계되어 있습니다.[3]

데이터베이스 마이그레이션이 포함된 릴리스는 롤백 전에 해당 리비전의 하위 호환성을 검토해야 합니다. 애플리케이션 이미지 롤백만으로 스키마를 자동 다운그레이드하지 마십시오. 운영 PostgreSQL은 배포 전 백업을 생성하고, 관리자 계정과 외부 AI API 키의 접근 권한을 정기적으로 검토하십시오.

## 4. 배포 전 확인표

| 확인 항목 | 완료 기준 |
|---|---|
| 비밀값 | `.env.production`과 GitHub Secrets만 사용하며 저장소에 커밋되지 않음 |
| 데이터베이스 | PostgreSQL 영속 볼륨 또는 Render 관리형 PostgreSQL 사용 |
| 준비 상태 | `/health/ready`가 200을 반환 |
| 마이그레이션 | `alembic upgrade head`가 성공하고 최신 리비전 적용 |
| CI | backend, frontend, docker 작업 모두 통과 |
| 배포 흐름 | Render 자동 배포 또는 훅 배포 중 하나만 활성화 |
| 채널 작업 안전성 | 외부 판매 채널 등록·가격·재고 변경은 명시적 승인 전 실행하지 않음 |

## References

[1]: https://render.com/docs/configure-environment-variables "Render: Environment Variables and Secrets"
[2]: https://render.com/docs/deploys "Render: Deploying on Render"
[3]: https://render.com/docs/deploys "Render: deploy steps, pre-deploy command, health checks"
[4]: https://render.com/docs/deploy-hooks "Render: Deploy Hooks"
