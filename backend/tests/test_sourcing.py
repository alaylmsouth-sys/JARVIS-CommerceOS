from fastapi.testclient import TestClient

from app.main import app


def login_headers(client: TestClient) -> dict[str, str]:
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.example.com", "password": "test-password"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def candidate_payload(name: str = "Portable Blender") -> dict:
    return {
        "name": name,
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


def test_create_candidate() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/sourcing/candidates",
            headers=login_headers(client),
            json=candidate_payload(),
        )

        assert response.status_code == 201
        body = response.json()
        assert body["status"] == "pending"
        assert body["notes"] == ""
        assert body["tags"] == ""
        assert body["margin_rate"] > 0


def test_duplicate_candidate_is_rejected() -> None:
    with TestClient(app) as client:
        headers = login_headers(client)
        payload = {
            "name": "Duplicate Product",
            "marketplace": "coupang",
            "country": "KR",
            "source_price": 10000,
            "target_price": 25000,
            "shipping_cost": 3000,
            "platform_fee_rate": 12,
            "ad_cost_rate": 5,
            "competition_score": 50,
            "trend_score": 70,
            "brand_score": 65,
        }
        first = client.post("/api/v1/sourcing/candidates", headers=headers, json=payload)
        second = client.post("/api/v1/sourcing/candidates", headers=headers, json=payload)
        assert first.status_code == 201
        assert second.status_code == 409


def test_candidate_search_scoring_status_and_persistence() -> None:
    with TestClient(app) as client:
        headers = login_headers(client)
        searched = client.post(
            "/api/v1/sourcing/search",
            headers=headers,
            json={"keyword": "휴대용 선풍기", "marketplace": "coupang", "country": "kr"},
        )
        assert searched.status_code == 200
        suggestions = searched.json()
        assert suggestions
        assert suggestions == sorted(
            suggestions,
            key=lambda item: item["total_score"],
            reverse=True,
        )

        suggestion = suggestions[0]
        created = client.post(
            "/api/v1/sourcing/candidates",
            headers=headers,
            json={
                key: suggestion[key]
                for key in (
                    "name",
                    "marketplace",
                    "country",
                    "source_price",
                    "target_price",
                    "shipping_cost",
                    "platform_fee_rate",
                    "ad_cost_rate",
                    "competition_score",
                    "trend_score",
                    "brand_score",
                )
            },
        )
        assert created.status_code == 201
        candidate = created.json()
        expected_cost = (
            candidate["source_price"]
            + candidate["shipping_cost"]
            + candidate["target_price"]
            * (candidate["platform_fee_rate"] + candidate["ad_cost_rate"])
            / 100
        )
        assert candidate["total_cost"] == round(expected_cost, 2)
        assert candidate["gross_profit"] == round(
            candidate["target_price"] - expected_cost,
            2,
        )

        candidate_id = candidate["id"]
        approved = client.patch(
            f"/api/v1/sourcing/candidates/{candidate_id}/status",
            headers=headers,
            json={"status": "approved"},
        )
        assert approved.status_code == 200
        assert approved.json()["status"] == "approved"

        rejected = client.patch(
            f"/api/v1/sourcing/candidates/{candidate_id}/status",
            headers=headers,
            json={"status": "rejected"},
        )
        assert rejected.status_code == 200
        assert rejected.json()["status"] == "rejected"

    with TestClient(app) as client:
        persisted = client.get(
            "/api/v1/sourcing/candidates",
            headers=login_headers(client),
        )
        assert persisted.status_code == 200
        assert persisted.json()[0]["id"] == candidate_id
        assert persisted.json()[0]["status"] == "rejected"


def test_candidate_identity_is_normalized_before_duplicate_check() -> None:
    with TestClient(app) as client:
        headers = login_headers(client)
        first = client.post(
            "/api/v1/sourcing/candidates",
            headers=headers,
            json=candidate_payload("Portable   Blender"),
        )
        duplicate_payload = candidate_payload(" Portable Blender ")
        duplicate_payload["country"] = "us"
        duplicate = client.post(
            "/api/v1/sourcing/candidates",
            headers=headers,
            json=duplicate_payload,
        )

        assert first.status_code == 201
        assert first.json()["name"] == "Portable Blender"
        assert duplicate.status_code == 409


def test_update_candidate_review_metadata() -> None:
    with TestClient(app) as client:
        headers = login_headers(client)
        created = client.post(
            "/api/v1/sourcing/candidates",
            headers=headers,
            json=candidate_payload("Desk Fan Review Target"),
        )
        assert created.status_code == 201
        candidate_id = created.json()["id"]

        updated = client.patch(
            f"/api/v1/sourcing/candidates/{candidate_id}/review",
            headers=headers,
            json={
                "status": "reviewing",
                "notes": "Supplier price needs confirmation.",
                "tags": "fan,summer,margin-check",
            },
        )

        assert updated.status_code == 200
        body = updated.json()
        assert body["status"] == "reviewing"
        assert body["notes"] == "Supplier price needs confirmation."
        assert body["tags"] == "fan,summer,margin-check"

        listed = client.get("/api/v1/sourcing/candidates", headers=headers)
        assert listed.status_code == 200
        assert listed.json()[0]["notes"] == "Supplier price needs confirmation."
