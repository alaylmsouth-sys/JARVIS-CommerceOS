import asyncio
import inspect
from typing import Any, Mapping

import pytest

from app.marketplaces import (
    MarketplaceAdapter,
    MarketplacePriceResult,
    MarketplaceSearchResult,
    MarketplaceStockResult,
    MarketplaceUploadResult,
)


class DemoMarketplace(MarketplaceAdapter):
    code = "demo"

    async def search(
        self,
        keyword: str,
        *,
        country: str = "KR",
        limit: int = 20,
    ) -> list[MarketplaceSearchResult]:
        return [{"external_id": "demo-1", "name": keyword, "price": 1000, "currency": "KRW"}]

    async def upload(self, product: Mapping[str, Any]) -> MarketplaceUploadResult:
        return {"listing_id": str(product["id"]), "status": "draft"}

    async def update_price(
        self,
        listing_id: str,
        price: float,
        *,
        currency: str = "KRW",
    ) -> MarketplacePriceResult:
        return {"listing_id": listing_id, "price": price, "currency": currency}

    async def stock(
        self,
        listing_id: str,
        quantity: int | None = None,
    ) -> MarketplaceStockResult:
        return {"listing_id": listing_id, "quantity": quantity or 0, "available": True}


def test_marketplace_adapter_exposes_mvp_contract() -> None:
    for method in ("search", "upload", "update_price", "stock"):
        assert inspect.iscoroutinefunction(getattr(MarketplaceAdapter, method))

    adapter = DemoMarketplace()
    assert asyncio.run(adapter.search("camping fan"))[0]["name"] == "camping fan"
    assert asyncio.run(adapter.upload({"id": 123}))["listing_id"] == "123"
    assert asyncio.run(adapter.update_price("listing-1", 12900))["price"] == 12900
    assert asyncio.run(adapter.stock("listing-1", 5))["quantity"] == 5


def test_marketplace_adapter_requires_contract_methods() -> None:
    class MissingMarketplace(MarketplaceAdapter):
        code = "missing"

    with pytest.raises(TypeError):
        MissingMarketplace()
