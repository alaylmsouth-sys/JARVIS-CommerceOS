from abc import ABC, abstractmethod
from typing import Any, Literal, Mapping, TypedDict


class MarketplaceSearchResult(TypedDict, total=False):
    external_id: str
    name: str
    price: float
    currency: str
    url: str
    raw: Mapping[str, Any]


class MarketplaceUploadResult(TypedDict, total=False):
    listing_id: str
    status: Literal["draft", "submitted", "published", "failed"]
    url: str
    raw: Mapping[str, Any]


class MarketplacePriceResult(TypedDict, total=False):
    listing_id: str
    price: float
    currency: str
    raw: Mapping[str, Any]


class MarketplaceStockResult(TypedDict, total=False):
    listing_id: str
    quantity: int
    available: bool
    raw: Mapping[str, Any]


class MarketplaceAdapter(ABC):
    code: str

    @abstractmethod
    async def search(
        self,
        keyword: str,
        *,
        country: str = "KR",
        limit: int = 20,
    ) -> list[MarketplaceSearchResult]:
        raise NotImplementedError

    @abstractmethod
    async def upload(self, product: Mapping[str, Any]) -> MarketplaceUploadResult:
        raise NotImplementedError

    @abstractmethod
    async def update_price(
        self,
        listing_id: str,
        price: float,
        *,
        currency: str = "KRW",
    ) -> MarketplacePriceResult:
        raise NotImplementedError

    @abstractmethod
    async def stock(
        self,
        listing_id: str,
        quantity: int | None = None,
    ) -> MarketplaceStockResult:
        raise NotImplementedError
