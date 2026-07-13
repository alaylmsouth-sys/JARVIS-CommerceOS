from fastapi.testclient import TestClient
from app.main import app
def test_health():
    with TestClient(app) as c: assert c.get('/health').status_code==200
def test_login_and_candidate():
    with TestClient(app) as c:
        r=c.post('/api/v1/auth/login',json={'email':'admin@test.local','password':'test-password'});assert r.status_code==200
        h={'Authorization':f"Bearer {r.json()['access_token']}"}
        r=c.post('/api/v1/sourcing/candidates',headers=h,json={'name':'Portable Blender','marketplace':'amazon','country':'US','source_price':12,'target_price':39,'shipping_cost':4,'platform_fee_rate':15,'ad_cost_rate':7,'competition_score':45,'trend_score':78,'brand_score':82});assert r.status_code==201
