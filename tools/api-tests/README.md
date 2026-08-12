# 체크리스트 API 검증 자산

이 폴더는 JARVIS-CommerceOS의 체크리스트 API를 실제 실행 중인 서버에서 확인하는 두 가지 방법을 제공합니다. 두 방법 모두 로그인, 목록 조회, 체크리스트 저장, 수정, 재조회 흐름을 검증합니다.

> 쓰기 검증은 체크리스트를 변경하거나 새 테스트 후보를 만듭니다. 운영 데이터를 바꾸지 않으려면 전용 테스트 계정을 사용하고, Python 스크립트에서는 `--create-candidate`를 사용하세요.

## Python 자동화 스크립트

CommerceOS를 먼저 실행한 뒤, `backend` 의존성이 설치된 환경에서 다음 명령을 실행하세요.

```bash
cd backend
export JARVIS_TEST_EMAIL='your-test-email@example.com'
export JARVIS_TEST_PASSWORD='your-password'
python ../tools/api-tests/test_checklists_api.py --list-only
```

읽기 전용 확인은 로그인과 `GET /api/v1/sourcing/checklists`만 수행합니다. 저장·수정까지 확인하려면 별도 테스트 후보를 만드는 다음 명령을 사용하세요.

```bash
python ../tools/api-tests/test_checklists_api.py --create-candidate
```

기존 후보를 명시적으로 검증하려면 해당 ID를 지정합니다.

```bash
python ../tools/api-tests/test_checklists_api.py --candidate-id 42
```

기본 API 주소는 `http://127.0.0.1:8001/api/v1`입니다. 다른 서버를 검증하려면 `--base-url https://example.com/api/v1` 또는 `JARVIS_API_BASE_URL`을 사용하세요.

## Postman 컬렉션

Postman에서 다음 두 파일을 가져옵니다.

| 파일 | 용도 |
| --- | --- |
| `tools/postman/JARVIS-CommerceOS-Checklist-API.postman_collection.json` | 로그인부터 저장·수정·재조회까지 실행하는 컬렉션 |
| `tools/postman/JARVIS-CommerceOS-Local.postman_environment.json` | 로컬 서버 주소와 자격 증명을 분리한 환경 템플릿 |

환경을 선택한 뒤 `email`과 `password`의 현재 값을 테스트 계정으로 입력하고, 컬렉션의 **Run**을 실행합니다. 컬렉션은 고유 이름의 테스트 후보를 생성하므로, 반복 실행해도 기존 후보와 이름이 충돌하지 않습니다.

## 성공 기준

| 단계 | 기대 결과 |
| --- | --- |
| 로그인 | `200`과 `access_token` 수신 |
| 목록 조회 | `200` 및 배열 응답 |
| 테스트 후보 생성 | `201` 및 후보 ID 수신 |
| 체크리스트 저장 | `200`, 선택한 Boolean 상태와 메모가 응답에 일치 |
| 체크리스트 수정 | `200`, `inventory_confirmed: true`가 응답에 유지 |
| 재조회 | 생성한 후보 ID의 체크리스트가 목록에 존재 |
