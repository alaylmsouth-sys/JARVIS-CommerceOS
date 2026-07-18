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
