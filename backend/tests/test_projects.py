from fastapi.testclient import TestClient

from app.main import app


def auth_headers(client: TestClient) -> dict[str, str]:
    login = client.post(
        "/api/v1/auth/login",
        json={
            "email": "admin@test.example.com",
            "password": "test-password",
        },
    )
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def test_project_candidate_workflow() -> None:
    with TestClient(app) as client:
        headers = auth_headers(client)

        project = client.post(
            "/api/v1/projects",
            headers=headers,
            json={"name": "Camping", "description": "Camping products"},
        )
        assert project.status_code == 201
        project_id = project.json()["id"]

        candidate = client.post(
            "/api/v1/sourcing/candidates",
            headers=headers,
            json={
                "name": "Camping Fan",
                "marketplace": "coupang",
                "country": "KR",
                "source_price": 20000,
                "target_price": 50000,
                "shipping_cost": 4000,
                "platform_fee_rate": 12,
                "ad_cost_rate": 5,
                "competition_score": 45,
                "trend_score": 80,
                "brand_score": 75,
            },
        )
        assert candidate.status_code == 201

        attached = client.post(
            f"/api/v1/projects/{project_id}/candidates",
            headers=headers,
            json={"candidate_id": candidate.json()["id"]},
        )
        assert attached.status_code == 204

        listed = client.get(
            f"/api/v1/projects/{project_id}/candidates",
            headers=headers,
        )
        assert listed.status_code == 200
        assert [item["name"] for item in listed.json()] == ["Camping Fan"]
