from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import select

from app.core.config import settings
from app.core.security import hash_password
from app.db.base import Base
from app.db.models import User
from app.db.session import SessionLocal, engine
from app.modules.auth.router import router as auth_router
from app.modules.projects.router import router as projects_router
from app.modules.sourcing.router import router as sourcing_router


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == settings.default_admin_email))
        if user is None:
            db.add(
                User(
                    email=settings.default_admin_email,
                    hashed_password=hash_password(settings.default_admin_password),
                    role="owner",
                    is_active=True,
                )
            )
            db.commit()


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)
app.include_router(auth_router, prefix="/api/v1")
app.include_router(sourcing_router, prefix="/api/v1")
app.include_router(projects_router, prefix="/api/v1")


@app.get("/")
def root() -> dict[str, str]:
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "jarvis-commerceos-api",
        "version": settings.app_version,
    }
