from app.schemas.sourcing import SourcingCandidateCreate, SourcingCandidateRead

class SourcingService:
    def __init__(self) -> None:
        self._items: list[SourcingCandidateRead] = []
        self._next_id = 1

    def list_candidates(self) -> list[SourcingCandidateRead]:
        return list(self._items)

    def create_candidate(self, payload: SourcingCandidateCreate) -> SourcingCandidateRead:
        margin_rate = round(((payload.target_price - payload.source_price) / payload.target_price) * 100, 2)
        total_score = round(
            margin_rate * 0.40
            + (100 - payload.competition_score) * 0.20
            + payload.trend_score * 0.25
            + payload.brand_score * 0.15,
            2,
        )
        item = SourcingCandidateRead(
            id=self._next_id,
            margin_rate=margin_rate,
            total_score=max(0, min(100, total_score)),
            status="pending",
            **payload.model_dump(),
        )
        self._items.append(item)
        self._next_id += 1
        return item

    def approve_candidate(self, candidate_id: int) -> SourcingCandidateRead | None:
        for index, item in enumerate(self._items):
            if item.id == candidate_id:
                updated = item.model_copy(update={"status": "approved"})
                self._items[index] = updated
                return updated
        return None

sourcing_service = SourcingService()
