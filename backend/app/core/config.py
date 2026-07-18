from functools import lru_cache
from typing import Literal

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "JARVIS-CommerceOS API"
    app_version: str = "1.3.2"
    environment: Literal["development", "test", "production"] = "development"
    database_url: str = "sqlite:///./jarvis.db"
    jwt_secret: str = "development-secret"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 1440
    default_admin_email: str = "admin@jarvis.example.com"
    default_admin_password: str = "change-me-now"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: object) -> object:
        if not isinstance(value, str):
            return value
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+psycopg://", 1)
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+psycopg://", 1)
        return value

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        if self.environment != "production":
            return self

        if self.database_url.startswith("sqlite"):
            raise ValueError("Production requires a persistent PostgreSQL database")
        if len(self.jwt_secret) < 32 or self.jwt_secret in {
            "development-secret",
            "replace-with-a-long-random-secret",
        }:
            raise ValueError("Production JWT_SECRET must be a random value of 32+ characters")
        if (
            len(self.default_admin_password) < 12
            or self.default_admin_password == "change-me-now"
        ):
            raise ValueError("Production admin password must be changed and use 12+ characters")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
