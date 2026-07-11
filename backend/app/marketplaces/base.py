from abc import ABC, abstractmethod
from typing import Any

class MarketplaceAdapter(ABC):
    code: str

    @abstractmethod
    async def search_products(self, keyword: str) -> list[dict[str, Any]]:
        raise NotImplementedError

    @abstractmethod
    async def create_listing(self, product: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    async def sync_inventory(self) -> None:
        raise NotImplementedError
