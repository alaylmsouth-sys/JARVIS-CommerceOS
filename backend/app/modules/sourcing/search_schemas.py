from typing import Literal
from pydantic import BaseModel, Field, field_validator

Marketplace = Literal["coupang", "naver", "amazon", "shopee", "lazada"]

class SearchRequest(BaseModel):
    keyword: str = Field(min_length=2, max_length=100)
    marketplace: Marketplace = "coupang"
    country: str = Field(default="KR", min_length=2, max_length=10)

    @field_validator("keyword")
    @classmethod
    def normalize_keyword(cls, value: str) -> str:
        value = " ".join(value.split())
        if len(value) < 2:
            raise ValueError("keyword must contain at least two characters")
        return value

    @field_validator("country")
    @classmethod
    def normalize_country(cls, value: str) -> str:
        return value.strip().upper()

class SearchCandidate(BaseModel):
    name: str
    marketplace: str
    country: str
    source_price: float
    target_price: float
    shipping_cost: float
    platform_fee_rate: float
    ad_cost_rate: float
    competition_score: float
    trend_score: float
    brand_score: float
    total_cost: float
    gross_profit: float
    margin_rate: float
    total_score: float
    recommendation: str
    explanation: str
