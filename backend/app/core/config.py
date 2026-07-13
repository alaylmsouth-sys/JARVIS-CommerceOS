from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
class Settings(BaseSettings):
    app_name:str='JARVIS-CommerceOS API'
    app_version:str='1.0.1'
    database_url:str='sqlite:///./jarvis.db'
    jwt_secret:str='development-secret'
    jwt_algorithm:str='HS256'
    access_token_minutes:int=1440
    default_admin_email:str='admin@jarvis.local'
    default_admin_password:str='change-me-now'
    model_config=SettingsConfigDict(env_file='.env',extra='ignore')
@lru_cache
def get_settings(): return Settings()
settings=get_settings()
