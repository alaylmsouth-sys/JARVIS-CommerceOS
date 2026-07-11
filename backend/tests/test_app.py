from fastapi.testclient import TestClient
from app.main import app
def test_flow():
 with TestClient(app) as c:
  assert c.get('/health').status_code==200
  t=c.post('/api/v1/auth/login',json={'email':'admin@example.com','password':'test-password'}).json()['access_token'];h={'Authorization':f'Bearer {t}'}
  r=c.post('/api/v1/sourcing/candidates',headers=h,json={'name':'Portable Blender','marketplace':'amazon','country':'US','source_price':12,'target_price':39,'shipping_cost':4,'platform_fee_rate':15,'ad_cost_rate':7,'competition_score':45,'trend_score':78,'brand_score':82})
  assert r.status_code==201 and r.json()['status']=='pending'
  rid=r.json()['id'];assert c.patch(f'/api/v1/sourcing/candidates/{rid}/status',headers=h,json={'status':'approved'}).json()['status']=='approved'
