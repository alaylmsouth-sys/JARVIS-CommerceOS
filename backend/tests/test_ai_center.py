from fastapi.testclient import TestClient

from app.main import app


def login_headers(client: TestClient) -> dict[str, str]:
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.example.com", "password": "test-password"},
    )
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def test_ai_staff_directory_requires_auth() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/ai-center/staff")
        assert response.status_code == 401


def test_ai_staff_directory_lists_domains() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/ai-center/staff", headers=login_headers(client))
        assert response.status_code == 200
        staff = response.json()
        domains = {item["domain"] for item in staff}
        assert "AI Sourcing" in domains
        assert "Finance" in domains
        assert "Operations" in domains
        assert all(item["id"] != "telegram" for item in staff)


def test_ai_staff_chat_returns_actions() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/ai-center/chat",
            headers=login_headers(client),
            json={
                "staff_id": "operations",
                "message": "Render 운영 전환 전에 뭘 봐야 해?",
                "context": "staging passed, Alembic enabled",
            },
        )
        assert response.status_code == 200
        body = response.json()
        assert body["staff_name"] == "Orin"
        assert "Render" in body["reply"]
        assert len(body["recommended_actions"]) == 3


def test_unknown_ai_staff_returns_404() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/ai-center/chat",
            headers=login_headers(client),
            json={"staff_id": "missing", "message": "hello"},
        )
        assert response.status_code == 404
