from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.security import create_access_token,verify_password
from app.db import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import LoginRequest,TokenResponse,UserRead
router=APIRouter(prefix='/auth',tags=['auth'])
@router.post('/login',response_model=TokenResponse)
def login(p:LoginRequest,db:Session=Depends(get_db)):
 u=db.scalar(select(User).where(User.email==p.email))
 if u is None or not verify_password(p.password,u.hashed_password):raise HTTPException(status_code=401,detail='Invalid email or password')
 return TokenResponse(access_token=create_access_token(u.email))
@router.get('/me',response_model=UserRead)
def me(u:User=Depends(get_current_user)):return u
