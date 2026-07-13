from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.security import create_access_token,verify_password
from app.db.models import User
from app.db.session import get_db
from app.modules.auth.schemas import LoginRequest,TokenResponse
router=APIRouter(prefix='/auth',tags=['auth'])
@router.post('/login',response_model=TokenResponse)
def login(payload:LoginRequest,db:Session=Depends(get_db)):
    user=db.scalar(select(User).where(User.email==payload.email))
    if user is None or not verify_password(payload.password,user.hashed_password): raise HTTPException(status_code=401,detail='Invalid email or password')
    return TokenResponse(access_token=create_access_token(user.email))
