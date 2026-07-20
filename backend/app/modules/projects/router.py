from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models import Project, ProjectCandidate, SourcingCandidate, User
from app.db.session import get_db
from app.modules.projects.schemas import (
    ProjectCandidateAttach,
    ProjectCreate,
    ProjectRead,
    ProjectStatusUpdate,
)
from app.modules.sourcing.schemas import CandidateRead
from app.shared.deps import get_current_user

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectRead])
def list_projects(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return list(db.scalars(select(Project).order_by(Project.created_at.desc())).all())


@router.post("", response_model=ProjectRead, status_code=201)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.scalar(select(Project).where(Project.name == payload.name))
    if existing is not None:
        raise HTTPException(status_code=409, detail="Duplicate project")

    project = Project(
        name=payload.name,
        description=payload.description,
        status="active",
        created_by_id=current_user.id,
    )
    db.add(project)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=409, detail="Duplicate project") from error
    db.refresh(project)
    return project


@router.patch("/{project_id}/status", response_model=ProjectRead)
def update_project_status(
    project_id: int,
    payload: ProjectStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    project.status = payload.status
    db.commit()
    db.refresh(project)
    return project


@router.post("/{project_id}/candidates", status_code=204)
def attach_candidate(
    project_id: int,
    payload: ProjectCandidateAttach,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    project = db.get(Project, project_id)
    candidate = db.get(SourcingCandidate, payload.candidate_id)

    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")

    existing = db.scalar(
        select(ProjectCandidate).where(
            ProjectCandidate.project_id == project_id,
            ProjectCandidate.candidate_id == payload.candidate_id,
        )
    )
    if existing is not None:
        raise HTTPException(status_code=409, detail="Candidate already attached")

    db.add(
        ProjectCandidate(
            project_id=project_id,
            candidate_id=payload.candidate_id,
        )
    )
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=409, detail="Candidate already attached") from error


@router.get("/{project_id}/candidates", response_model=list[CandidateRead])
def list_project_candidates(
    project_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    query = (
        select(SourcingCandidate)
        .join(
            ProjectCandidate,
            ProjectCandidate.candidate_id == SourcingCandidate.id,
        )
        .where(ProjectCandidate.project_id == project_id)
        .order_by(SourcingCandidate.created_at.desc())
    )
    return list(db.scalars(query).all())
