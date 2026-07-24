from __future__ import annotations

import base64
import hashlib
import hmac
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlencode

import httpx

from app.core.config import settings
from app.modules.sourcing.schemas import CandidateCreate

PRODUCT_SEARCH_PATH = "/v2/providers/seller_api/apis/api/v1/marketplace/seller-products"


def configured() -> bool:
    return bool(settings.coupang_access_key and settings.coupang_secret_key and settings.coupang_vendor_id)


def authorization(method: str, path: str, query: str, signed_date: str) -> str:
    if settings.coupang_access_key is None or settings.coupang_secret_key is None:
        raise ValueError("Coupang credentials are not configured")
    message = f"{signed_date}{method.upper()}{path}{query}"
    digest = hmac.new(
        settings.coupang_secret_key.get_secret_value().encode(),
        message.encode(),
        hashlib.sha256,
    ).digest()
    signature = base64.b64encode(digest).decode()
    return (
        "CEA algorithm=HmacSHA256, "
        f"access-key={settings.coupang_access_key.get_secret_value()}, "
        f"signed-date={signed_date}, signature={signature}"
    )


def extract_items(payload: dict[str, Any]) -> list[dict[str, Any]]:
    data = payload.get("data", payload)
    if isinstance(data, dict):
        for key in ("content", "items", "products"):
            value = data.get(key)
            if isinstance(value, list):
                return [item for item in value if isinstance(item, dict)]
    if isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]
    return []


def as_candidate(item: dict[str, Any], keyword: str) -> CandidateCreate | None:
    name = str(item.get("sellerProductName") or item.get("productName") or item.get("name") or "").strip()
    if keyword.lower() not in name.lower():
        return None
    price = float(item.get("salePrice") or item.get("price") or item.get("displayProductPrice") or 0)
    if not name or price <= 0:
        return None
    source = round(price * 0.58, 2)
    return CandidateCreate(
        name=name,
        marketplace="coupang",
        country="KR",
        source_price=source,
        target_price=price,
        shipping_cost=3000,
        platform_fee_rate=12,
        ad_cost_rate=5,
        competition_score=55,
        trend_score=65,
        brand_score=60,
    )


def search_coupang(keyword: str) -> list[CandidateCreate]:
    if not configured():
        return []

    path = PRODUCT_SEARCH_PATH
    query = urlencode({"vendorId": settings.coupang_vendor_id, "keyword": keyword, "page": 1, "size": 10})
    signed_date = datetime.now(timezone.utc).strftime("%y%m%dT%H%M%SZ")
    response = httpx.get(
        f"{settings.coupang_base_url.rstrip('/')}{path}?{query}",
        headers={"Authorization": authorization("GET", path, query, signed_date)},
        timeout=settings.coupang_timeout_seconds,
    )
    response.raise_for_status()
    candidates = [as_candidate(item, keyword) for item in extract_items(response.json())]
    return [candidate for candidate in candidates if candidate is not None]
