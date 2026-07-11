from datetime import datetime,timedelta,timezone
from jose import JWTError,jwt
from passlib.context import CryptContext
from app.core.config import settings
pwd=CryptContext(schemes=['bcrypt'],deprecated='auto')
def hash_password(v:str)->str:return pwd.hash(v)
def verify_password(v:str,h:str)->bool:return pwd.verify(v,h)
def create_access_token(subject:str)->str:
 exp=datetime.now(timezone.utc)+timedelta(minutes=settings.access_token_minutes)
 return jwt.encode({'sub':subject,'exp':exp},settings.jwt_secret,algorithm=settings.jwt_algorithm)
def decode_access_token(token:str)->str|None:
 try:
  sub=jwt.decode(token,settings.jwt_secret,algorithms=[settings.jwt_algorithm]).get('sub')
  return sub if isinstance(sub,str) else None
 except JWTError:return None
