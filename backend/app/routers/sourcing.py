from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy import func,select
from sqlalchemy.orm import Session
from app.db import get_db
from app.deps import get_current_user
from app.models import AuditLog,Candidate,User
from app.schemas import CandidateCreate,CandidateRead,CandidateStatusUpdate,Summary
from app.services.scoring import calculate
router=APIRouter(prefix='/sourcing',tags=['sourcing'])
@router.get('/summary',response_model=Summary)
def summary(db:Session=Depends(get_db),_:User=Depends(get_current_user)):
 count=lambda s:db.scalar(select(func.count(Candidate.id)).where(Candidate.status==s)) or 0
 total=db.scalar(select(func.count(Candidate.id))) or 0; avg=db.scalar(select(func.avg(Candidate.total_score))) or 0; margin=db.scalar(select(func.avg(Candidate.margin_rate))) or 0
 return Summary(total_candidates=total,pending_candidates=count('pending'),approved_candidates=count('approved'),rejected_candidates=count('rejected'),average_score=round(float(avg),2),average_margin_rate=round(float(margin),2))
@router.get('/candidates',response_model=list[CandidateRead])
def list_candidates(db:Session=Depends(get_db),_:User=Depends(get_current_user)):return list(db.scalars(select(Candidate).order_by(Candidate.created_at.desc())).all())
@router.post('/candidates',response_model=CandidateRead,status_code=201)
def create(p:CandidateCreate,db:Session=Depends(get_db),u:User=Depends(get_current_user)):
 s=calculate(p); c=Candidate(**p.model_dump(),total_cost=s.total_cost,gross_profit=s.gross_profit,margin_rate=s.margin_rate,total_score=s.total_score,recommendation=s.recommendation,explanation=s.explanation,status='pending',created_by_id=u.id)
 db.add(c);db.flush();db.add(AuditLog(actor_user_id=u.id,action='candidate.created',entity_type='candidate',entity_id=str(c.id),detail=c.name));db.commit();db.refresh(c);return c
@router.patch('/candidates/{cid}/status',response_model=CandidateRead)
def set_status(cid:int,p:CandidateStatusUpdate,db:Session=Depends(get_db),u:User=Depends(get_current_user)):
 c=db.get(Candidate,cid)
 if c is None:raise HTTPException(status_code=404,detail='Candidate not found')
 c.status=p.status;db.add(AuditLog(actor_user_id=u.id,action=f'candidate.{p.status}',entity_type='candidate',entity_id=str(c.id),detail=c.name));db.commit();db.refresh(c);return c
