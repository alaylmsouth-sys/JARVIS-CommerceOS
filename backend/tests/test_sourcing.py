from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_candidate() -> None:
    response = client.post(
        "/api/v1/sourcing/candidates",
        json={
            "name": "Portable Blender",
            "marketplace": "amazon",
            "source_price": 12,
            "target_price": 39,
            "competition_score": 45,
            "trend_score": 78,
            "brand_score": 82
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "pending"
    assert body["margin_rate"] > 0
