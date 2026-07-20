from fastapi.testclient import TestClient

from app.main import app


def get_token(client: TestClient) -> str:
    login = client.post(
        "/api/v1/auth/login",
        json={
            "email": "admin@test.example.com",
            "password": "test-password",
        },
    )
    assert login.status_code == 200, login.text
    return login.json()["access_token"]


def test_create_candidate() -> None:
    with TestClient(app) as client:
        token = get_token(client)

        response = client.post(
            "/api/v1/sourcing/candidates",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "name": "Portable Blender Sourcing Test",
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
            },
        )

        assert response.status_code == 201, response.text
        body = response.json()
        assert body["status"] == "pending"
        assert body["margin_rate"] > 0
