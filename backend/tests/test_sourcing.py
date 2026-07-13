from fastapi.testclient import TestClient

from app.main import app


def test_create_candidate() -> None:
    with TestClient(app) as client:
        login = client.post(
            "/api/v1/auth/login",
            json={
                "email": "admin@test.example.com",
                "password": "test-password",
            },
        )
        assert login.status_code == 200

        token = login.json()["access_token"]

        response = client.post(
            "/api/v1/sourcing/candidates",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "name": "Portable Blender",
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

        assert response.status_code == 201
        body = response.json()
        assert body["status"] == "pending"
        assert body["margin_rate"] > 0

def test_duplicate_candidate_is_rejected() -> None:
    with TestClient(app) as client:
        login = client.post('/api/v1/auth/login', json={'email':'admin@test.example.com','password':'test-password'})
        token = login.json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}
        payload = {'name':'Duplicate Product','marketplace':'coupang','country':'KR','source_price':10000,'target_price':25000,'shipping_cost':3000,'platform_fee_rate':12,'ad_cost_rate':5,'competition_score':50,'trend_score':70,'brand_score':65}
        first = client.post('/api/v1/sourcing/candidates', headers=headers, json=payload)
        second = client.post('/api/v1/sourcing/candidates', headers=headers, json=payload)
        assert first.status_code == 201
        assert second.status_code == 409
