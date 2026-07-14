from datetime import datetime,timezone
from sqlalchemy import Boolean,DateTime,Float,ForeignKey,Integer,String,Text
from sqlalchemy.orm import Mapped,mapped_column
from app.db.base import Base
def utcnow(): return datetime.now(timezone.utc)
class User(Base):
    __tablename__='users'
    id:Mapped[int]=mapped_column(Integer,primary_key=True)
    email:Mapped[str]=mapped_column(String(255),unique=True,index=True)
    hashed_password:Mapped[str]=mapped_column(String(255))
    role:Mapped[str]=mapped_column(String(30),default='owner')
    is_active:Mapped[bool]=mapped_column(Boolean,default=True)
class SourcingCandidate(Base):
    __tablename__='sourcing_candidates'
    id:Mapped[int]=mapped_column(Integer,primary_key=True)
    name:Mapped[str]=mapped_column(String(200),index=True)
    marketplace:Mapped[str]=mapped_column(String(40),index=True)
    country:Mapped[str]=mapped_column(String(10),default='KR')
    source_price:Mapped[float]=mapped_column(Float)
    target_price:Mapped[float]=mapped_column(Float)
    shipping_cost:Mapped[float]=mapped_column(Float,default=0)
    platform_fee_rate:Mapped[float]=mapped_column(Float,default=12)
    ad_cost_rate:Mapped[float]=mapped_column(Float,default=5)
    competition_score:Mapped[float]=mapped_column(Float)
    trend_score:Mapped[float]=mapped_column(Float)
    brand_score:Mapped[float]=mapped_column(Float)
    total_cost:Mapped[float]=mapped_column(Float)
    gross_profit:Mapped[float]=mapped_column(Float)
    margin_rate:Mapped[float]=mapped_column(Float)
    total_score:Mapped[float]=mapped_column(Float)
    recommendation:Mapped[str]=mapped_column(String(30))
    explanation:Mapped[str]=mapped_column(Text)
    status:Mapped[str]=mapped_column(String(30),default='pending',index=True)
    created_by_id:Mapped[int]=mapped_column(ForeignKey('users.id'))
    created_at:Mapped[datetime]=mapped_column(DateTime(timezone=True),default=utcnow)
    updated_at:Mapped[datetime]=mapped_column(DateTime(timezone=True),default=utcnow,onupdate=utcnow)
class AuditLog(Base):
    __tablename__='audit_logs'
    id:Mapped[int]=mapped_column(Integer,primary_key=True)
    actor_user_id:Mapped[int|None]=mapped_column(Integer,nullable=True)
    action:Mapped[str]=mapped_column(String(100),index=True)
    entity_type:Mapped[str]=mapped_column(String(100))
    entity_id:Mapped[str]=mapped_column(String(100))
    detail:Mapped[str|None]=mapped_column(Text,nullable=True)


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="active", index=True)
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )


class ProjectCandidate(Base):
    __tablename__ = "project_candidates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    candidate_id: Mapped[int] = mapped_column(
        ForeignKey("sourcing_candidates.id"), index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
