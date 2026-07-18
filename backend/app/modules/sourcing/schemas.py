from datetime import datetime
from typing import Literal
from pydantic import BaseModel,ConfigDict,Field
CandidateStatus = Literal['pending','reviewing','on_hold','approved','rejected','selected','linked']
class CandidateCreate(BaseModel):
    name:str=Field(min_length=2,max_length=200)
    marketplace:Literal['coupang','naver','amazon','shopee','lazada']
    country:str='KR'
    source_price:float=Field(gt=0)
    target_price:float=Field(gt=0)
    shipping_cost:float=Field(default=0,ge=0)
    platform_fee_rate:float=Field(default=12,ge=0,le=50)
    ad_cost_rate:float=Field(default=5,ge=0,le=50)
    competition_score:float=Field(ge=0,le=100)
    trend_score:float=Field(ge=0,le=100)
    brand_score:float=Field(ge=0,le=100)
class CandidateRead(BaseModel):
    model_config=ConfigDict(from_attributes=True)
    id:int;name:str;marketplace:str;country:str;source_price:float;target_price:float;shipping_cost:float;platform_fee_rate:float;ad_cost_rate:float;competition_score:float;trend_score:float;brand_score:float;total_cost:float;gross_profit:float;margin_rate:float;total_score:float;recommendation:str;explanation:str;status:str;notes:str;tags:str;created_at:datetime;updated_at:datetime
class CandidateStatusUpdate(BaseModel): status:CandidateStatus
class CandidateReviewUpdate(BaseModel):
    status:CandidateStatus
    notes:str=Field(default='',max_length=5000)
    tags:str=Field(default='',max_length=500)
