from fastapi import Depends,HTTPException,status
from fastapi.security import HTTPAuthorizationCredentials,HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.security import decode_access_token
from app.db import get_db
from app.models import User
bearer=HTTPBearer(auto_error=False)
def get_current_user(c:HTTPAuthorizationCredentials|None=Depends(bearer),db:Session=Depends(get_db))->User:
 if c is None:raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail='Authentication required')
 sub=decode_access_token(c.credentials); user=db.scalar(select(User).where(User.email==sub)) if sub else None
 if user is None or not user.is_active:raise HTTPException(status_code=401,detail='Invalid or expired token')
 return user
