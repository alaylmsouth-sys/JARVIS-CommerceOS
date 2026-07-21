import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core.config import Settings
from app.main import app
from app.modules.ai_center import provider, service


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


def test_openai_provider_requires_api_key() -> None:
    with pytest.raises(ValidationError) as exc_info:
        Settings(ai_provider="openai", openai_api_key=None)

    assert "OPENAI_API_KEY is required" in str(exc_info.value)


def test_provider_response_text_extraction() -> None:
    assert provider.extract_response_text({"output_text": " model reply "}) == "model reply"
    assert provider.extract_response_text(
        {"output": [{"content": [{"text": "first"}, {"text": "second"}]}]}
    ) == "first\nsecond"


def test_ai_staff_chat_uses_provider_when_enabled(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(provider, "provider_enabled", lambda: True)
    monkeypatch.setattr(provider, "build_openai_reply", lambda staff, message, context: "model-backed reply")

    reply, actions = service.build_reply(service.STAFF["operations"], "what next?")

    assert reply == "model-backed reply"
    assert len(actions) == 3


def test_ai_staff_chat_falls_back_when_provider_fails(monkeypatch: pytest.MonkeyPatch) -> None:
    def fail_provider(staff: service.AIStaff, message: str, context: str) -> str:
        raise RuntimeError("provider unavailable")

    monkeypatch.setattr(provider, "provider_enabled", lambda: True)
    monkeypatch.setattr(provider, "build_openai_reply", fail_provider)

    reply, actions = service.build_reply(service.STAFF["operations"], "Render 배포 확인")

    assert "Orin / Operating System Architect" in reply
    assert len(actions) == 3
