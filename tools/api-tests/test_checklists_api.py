#!/usr/bin/env python3
"""JARVIS-CommerceOS 체크리스트 API의 라이브 검증 스크립트.

기본 동작은 로그인과 목록 조회만 수행합니다. 후보를 새로 만들거나 체크리스트를
변경하려면 --candidate-id 또는 --create-candidate을 명시적으로 지정해야 합니다.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


@dataclass
class ApiFailure(Exception):
    status: int
    detail: str

    def __str__(self) -> str:
        return f"HTTP {self.status}: {self.detail}"


def request_json(
    method: str,
    url: str,
    *,
    payload: dict[str, Any] | None = None,
    token: str | None = None,
) -> tuple[int, Any]:
    headers = {"Accept": "application/json"}
    data = None
    if payload is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(payload).encode("utf-8")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    request = Request(url, data=data, headers=headers, method=method)
    try:
        with urlopen(request, timeout=20) as response:
            raw = response.read().decode("utf-8")
            return response.status, json.loads(raw) if raw else None
    except HTTPError as error:
        raw = error.read().decode("utf-8", errors="replace")
        try:
            detail = json.loads(raw).get("detail", raw)
        except json.JSONDecodeError:
            detail = raw
        raise ApiFailure(error.code, str(detail)) from error
    except URLError as error:
        raise RuntimeError(f"서버에 연결할 수 없습니다: {error.reason}") from error


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def create_candidate(base_url: str, token: str) -> int:
    suffix = int(time.time())
    payload = {
        "name": f"Checklist API Test {suffix}",
        "marketplace": "amazon",
        "country": "US",
        "source_price": 12,
        "target_price": 39,
        "shipping_cost": 4,
        "platform_fee_rate": 15,
        "ad_cost_rate": 7,
        "competition_score": 45,
        "trend_score": 78,
        "brand_score": 82,
    }
    status, body = request_json(
        "POST", f"{base_url}/sourcing/candidates", payload=payload, token=token
    )
    require(status == 201, "후보 생성은 HTTP 201을 반환해야 합니다.")
    require(isinstance(body.get("id"), int), "생성 응답에 후보 ID가 없습니다.")
    return body["id"]


def main() -> int:
    parser = argparse.ArgumentParser(
        description="JARVIS-CommerceOS 체크리스트 API를 라이브 서버에서 검증합니다."
    )
    parser.add_argument(
        "--base-url",
        default=os.getenv("JARVIS_API_BASE_URL", "http://127.0.0.1:8001/api/v1"),
        help="API 기본 주소 (기본값: http://127.0.0.1:8001/api/v1)",
    )
    parser.add_argument("--email", default=os.getenv("JARVIS_TEST_EMAIL"))
    parser.add_argument("--password", default=os.getenv("JARVIS_TEST_PASSWORD"))
    parser.add_argument("--candidate-id", type=int, help="체크리스트를 저장할 기존 후보 ID")
    parser.add_argument(
        "--create-candidate",
        action="store_true",
        help="격리된 테스트 후보를 새로 생성한 뒤 체크리스트를 검증합니다.",
    )
    parser.add_argument(
        "--list-only",
        action="store_true",
        help="로그인과 GET /checklists만 검증합니다. 기존 데이터를 변경하지 않습니다.",
    )
    args = parser.parse_args()

    if not args.email or not args.password:
        parser.error("--email 및 --password 또는 JARVIS_TEST_EMAIL/PASSWORD가 필요합니다.")
    if args.candidate_id and args.create_candidate:
        parser.error("--candidate-id와 --create-candidate은 함께 사용할 수 없습니다.")

    base_url = args.base_url.rstrip("/")
    status, login = request_json(
        "POST", f"{base_url}/auth/login", payload={"email": args.email, "password": args.password}
    )
    require(status == 200, "로그인은 HTTP 200을 반환해야 합니다.")
    token = login.get("access_token")
    require(isinstance(token, str) and token, "로그인 응답에 access_token이 없습니다.")
    print("PASS  로그인: access_token 수신")

    status, before = request_json("GET", f"{base_url}/sourcing/checklists", token=token)
    require(status == 200 and isinstance(before, list), "GET /checklists는 배열과 HTTP 200을 반환해야 합니다.")
    print(f"PASS  목록 조회: 기존 체크리스트 {len(before)}개")

    if args.list_only:
        print("DONE  읽기 전용 검증을 완료했습니다.")
        return 0

    candidate_id = args.candidate_id
    if args.create_candidate:
        candidate_id = create_candidate(base_url, token)
        print(f"PASS  테스트 후보 생성: candidate_id={candidate_id}")
    if candidate_id is None:
        parser.error("쓰기 검증에는 --candidate-id 또는 --create-candidate가 필요합니다. 읽기만 하려면 --list-only를 사용하세요.")

    first_payload = {
        "copy_ready": True,
        "images_ready": True,
        "supplier_confirmed": True,
        "inventory_confirmed": False,
        "pricing_confirmed": True,
        "policy_checked": False,
        "notes": "Automated checklist API verification.",
    }
    status, saved = request_json(
        "PUT",
        f"{base_url}/sourcing/candidates/{candidate_id}/checklist",
        payload=first_payload,
        token=token,
    )
    require(status == 200, "첫 체크리스트 저장은 HTTP 200을 반환해야 합니다.")
    require(saved.get("candidate_id") == candidate_id, "저장 응답의 candidate_id가 일치하지 않습니다.")
    for field, expected in first_payload.items():
        require(saved.get(field) == expected, f"저장 응답의 {field} 값이 일치하지 않습니다.")
    print("PASS  체크리스트 생성 또는 전체 저장")

    update_payload = {**first_payload, "inventory_confirmed": True, "notes": "Inventory confirmed by automated verification."}
    status, updated = request_json(
        "PUT",
        f"{base_url}/sourcing/candidates/{candidate_id}/checklist",
        payload=update_payload,
        token=token,
    )
    require(status == 200, "체크리스트 수정은 HTTP 200을 반환해야 합니다.")
    require(updated.get("inventory_confirmed") is True, "수정된 inventory_confirmed 값이 저장되지 않았습니다.")
    print("PASS  체크리스트 수정")

    status, after = request_json("GET", f"{base_url}/sourcing/checklists", token=token)
    require(status == 200 and isinstance(after, list), "수정 후 목록 조회가 실패했습니다.")
    persisted = next((item for item in after if item.get("candidate_id") == candidate_id), None)
    require(persisted is not None, "저장한 체크리스트가 목록에서 조회되지 않습니다.")
    require(persisted.get("inventory_confirmed") is True, "목록에서 수정된 체크리스트 상태가 유지되지 않습니다.")
    print("PASS  목록 재조회 및 저장 상태 확인")
    print(f"DONE  candidate_id={candidate_id}의 전체 체크리스트 API 검증을 완료했습니다.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ApiFailure, AssertionError, RuntimeError) as error:
        print(f"FAIL  {error}", file=sys.stderr)
        raise SystemExit(1)
