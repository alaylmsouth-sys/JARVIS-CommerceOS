from typing import Literal
from pydantic import BaseModel, Field

Marketplace = Literal["coupang", "naver", "amazon", "shopee", "lazada"]

class SourcingCandidateCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    marketplace: Marketplace
    source_price: float = Field(gt=0)
    target_price: float = Field(gt=0)
    competition_score: float = Field(ge=0, le=100)
    trend_score: float = Field(ge=0, le=100)
    brand_score: float = Field(ge=0, le=100)

class SourcingCandidateRead(SourcingCandidateCreate):
    id: int
    margin_rate: float
    total_score: float
    status: Literal["pending", "approved", "rejected"]
