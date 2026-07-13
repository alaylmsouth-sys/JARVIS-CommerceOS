from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.models import AuditLog,SourcingCandidate,User
from app.db.session import get_db
from app.modules.sourcing.schemas import CandidateCreate,CandidateRead,CandidateStatusUpdate
from app.modules.sourcing.scoring import calculate_score
from app.shared.deps import get_current_user
router=APIRouter(prefix='/sourcing',tags=['sourcing'])
@router.get('/candidates',response_model=list[CandidateRead])
def list_candidates(db:Session=Depends(get_db),_:User=Depends(get_current_user)):
    return list(db.scalars(select(SourcingCandidate).order_by(SourcingCandidate.created_at.desc())).all())
@router.post('/candidates',response_model=CandidateRead,status_code=201)
def create_candidate(payload:CandidateCreate,db:Session=Depends(get_db),user:User=Depends(get_current_user)):
    s=calculate_score(payload)
    c=SourcingCandidate(**payload.model_dump(),total_cost=s.total_cost,gross_profit=s.gross_profit,margin_rate=s.margin_rate,total_score=s.total_score,recommendation=s.recommendation,explanation=s.explanation,status='pending',created_by_id=user.id)
    db.add(c);db.flush();db.add(AuditLog(actor_user_id=user.id,action='candidate.created',entity_type='sourcing_candidate',entity_id=str(c.id),detail=c.name));db.commit();db.refresh(c);return c
@router.patch('/candidates/{candidate_id}/status',response_model=CandidateRead)
def update_status(candidate_id:int,payload:CandidateStatusUpdate,db:Session=Depends(get_db),user:User=Depends(get_current_user)):
    c=db.get(SourcingCandidate,candidate_id)
    if c is None: raise HTTPException(status_code=404,detail='Candidate not found')
    c.status=payload.status;db.add(AuditLog(actor_user_id=user.id,action=f'candidate.{payload.status}',entity_type='sourcing_candidate',entity_id=str(c.id),detail=c.name));db.commit();db.refresh(c);return c
