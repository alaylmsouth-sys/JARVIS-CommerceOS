from fastapi import APIRouter, HTTPException
from app.schemas.sourcing import SourcingCandidateCreate, SourcingCandidateRead
from app.services.sourcing import sourcing_service

router = APIRouter(prefix="/sourcing", tags=["sourcing"])

@router.get("/candidates", response_model=list[SourcingCandidateRead])
def list_candidates() -> list[SourcingCandidateRead]:
    return sourcing_service.list_candidates()

@router.post("/candidates", response_model=SourcingCandidateRead, status_code=201)
def create_candidate(payload: SourcingCandidateCreate) -> SourcingCandidateRead:
    return sourcing_service.create_candidate(payload)

@router.post("/candidates/{candidate_id}/approve", response_model=SourcingCandidateRead)
def approve_candidate(candidate_id: int) -> SourcingCandidateRead:
    candidate = sourcing_service.approve_candidate(candidate_id)
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate
