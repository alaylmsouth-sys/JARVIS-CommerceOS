from datetime import datetime
from typing import Literal
from pydantic import BaseModel,ConfigDict,EmailStr,Field
Marketplace=Literal['coupang','naver','amazon','shopee','lazada']; Status=Literal['pending','approved','rejected']
class LoginRequest(BaseModel):email:EmailStr; password:str=Field(min_length=8)
class TokenResponse(BaseModel):access_token:str; token_type:str='bearer'
class UserRead(BaseModel):
 model_config=ConfigDict(from_attributes=True); id:int; email:EmailStr; role:str; is_active:bool
class CandidateCreate(BaseModel):
 name:str=Field(min_length=2,max_length=200); marketplace:Marketplace; country:str='KR'
 source_price:float=Field(gt=0); target_price:float=Field(gt=0); shipping_cost:float=Field(default=0,ge=0)
 platform_fee_rate:float=Field(default=12,ge=0,le=50); ad_cost_rate:float=Field(default=5,ge=0,le=50)
 competition_score:float=Field(ge=0,le=100); trend_score:float=Field(ge=0,le=100); brand_score:float=Field(ge=0,le=100); notes:str|None=None
class CandidateRead(CandidateCreate):
 model_config=ConfigDict(from_attributes=True); id:int; total_cost:float; gross_profit:float; margin_rate:float; total_score:float; recommendation:str; explanation:str; status:str; created_at:datetime; updated_at:datetime
class CandidateStatusUpdate(BaseModel):status:Status
class Summary(BaseModel):total_candidates:int; pending_candidates:int; approved_candidates:int; rejected_candidates:int; average_score:float; average_margin_rate:float
