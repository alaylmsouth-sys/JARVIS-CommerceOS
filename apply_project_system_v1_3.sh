#!/usr/bin/env bash
set -euo pipefail

cd "${1:-.}"

mkdir -p backend/app/modules/projects
touch backend/app/modules/projects/__init__.py

cat >> backend/app/db/models.py <<'PY'


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
PY

cat > backend/app/modules/projects/schemas.py <<'PY'
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ProjectCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=1000)


class ProjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    status: str
    created_at: datetime
    updated_at: datetime


class ProjectStatusUpdate(BaseModel):
    status: Literal["active", "paused", "completed"]


class ProjectCandidateAttach(BaseModel):
    candidate_id: int
PY

cat > backend/app/modules/projects/router.py <<'PY'
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
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
    db.commit()
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
    db.commit()


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
PY

python - <<'PY'
from pathlib import Path

path = Path("backend/app/main.py")
text = path.read_text(encoding="utf-8")

if "projects_router" not in text:
    text = text.replace(
        "from app.modules.sourcing.router import router as sourcing_router",
        "from app.modules.sourcing.router import router as sourcing_router\n"
        "from app.modules.projects.router import router as projects_router",
    )
    text = text.replace(
        "app.include_router(sourcing_router, prefix=\"/api/v1\")",
        "app.include_router(sourcing_router, prefix=\"/api/v1\")\n"
        "app.include_router(projects_router, prefix=\"/api/v1\")",
    )

path.write_text(text, encoding="utf-8")
PY

cat > frontend/app/projects/page.tsx <<'TSX'
"use client";

import { FormEvent, useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api/backend";

type Project = {
  id: number;
  name: string;
  description: string | null;
  status: string;
};

type Candidate = {
  id: number;
  name: string;
  marketplace: string;
  total_score: number;
  margin_rate: number;
  status: string;
};

export default function ProjectsPage() {
  const [token, setToken] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [projectCandidates, setProjectCandidates] = useState<Candidate[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("jarvis_token");
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    if (token) {
      void loadProjects();
      void loadCandidates();
    }
  }, [token]);

  async function authFetch(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    headers.set("authorization", `Bearer ${token}`);
    if (init.body) headers.set("content-type", "application/json");
    return fetch(`${API}${path}`, { ...init, headers, cache: "no-store" });
  }

  async function loadProjects() {
    const response = await authFetch("/api/v1/projects");
    if (response.ok) setProjects(await response.json());
  }

  async function loadCandidates() {
    const response = await authFetch("/api/v1/sourcing/candidates");
    if (response.ok) setCandidates(await response.json());
  }

  async function createProject(event: FormEvent) {
    event.preventDefault();
    const response = await authFetch("/api/v1/projects", {
      method: "POST",
      body: JSON.stringify({ name, description: description || null }),
    });

    if (response.status === 409) {
      setMessage("같은 이름의 프로젝트가 이미 있습니다.");
      return;
    }

    if (!response.ok) {
      setMessage(`프로젝트 생성 실패: ${await response.text()}`);
      return;
    }

    setName("");
    setDescription("");
    setMessage("프로젝트를 생성했습니다.");
    await loadProjects();
  }

  async function selectProject(projectId: number) {
    setSelectedProject(projectId);
    const response = await authFetch(`/api/v1/projects/${projectId}/candidates`);
    if (response.ok) setProjectCandidates(await response.json());
  }

  async function attachCandidate(candidateId: number) {
    if (!selectedProject) {
      setMessage("먼저 프로젝트를 선택하세요.");
      return;
    }

    const response = await authFetch(
      `/api/v1/projects/${selectedProject}/candidates`,
      {
        method: "POST",
        body: JSON.stringify({ candidate_id: candidateId }),
      },
    );

    if (response.status === 409) {
      setMessage("이미 프로젝트에 포함된 후보입니다.");
      return;
    }

    if (!response.ok) {
      setMessage(`추가 실패: ${await response.text()}`);
      return;
    }

    setMessage("후보를 프로젝트에 추가했습니다.");
    await selectProject(selectedProject);
  }

  return (
    <main className="app">
      <aside>
        <h1>JARVIS</h1>
        <nav>
          <a href="/sourcing">AI Sourcing</a>
          <b>Projects</b>
          <span>Commerce</span>
          <span>Trading</span>
          <span>Telegram</span>
          <span>Media Studio</span>
          <span>Finance</span>
          <span>Settings</span>
        </nav>
      </aside>

      <section className="page">
        <header>
          <div>
            <small>PROJECT SYSTEM</small>
            <h2>Projects</h2>
            <p>상품 후보를 주제별 프로젝트로 묶어 관리합니다.</p>
          </div>
        </header>

        <div className="workspace">
          <section className="card">
            <h3>새 프로젝트</h3>
            <form onSubmit={createProject} className="project-form">
              <input
                required
                placeholder="예: 캠핑용품"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <input
                placeholder="설명"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
              <button>프로젝트 생성</button>
            </form>

            {message && <p className="notice">{message}</p>}

            <div className="project-list">
              {projects.map((project) => (
                <button
                  key={project.id}
                  className={
                    selectedProject === project.id
                      ? "project-item active"
                      : "project-item"
                  }
                  onClick={() => void selectProject(project.id)}
                >
                  <strong>{project.name}</strong>
                  <span>{project.status}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="card">
            <h3>프로젝트 상품</h3>
            {!selectedProject ? (
              <div className="empty">왼쪽에서 프로젝트를 선택하세요.</div>
            ) : (
              <div className="result-list">
                {projectCandidates.map((item) => (
                  <article className="result-card" key={item.id}>
                    <h4>{item.name}</h4>
                    <p>
                      {item.marketplace.toUpperCase()} · {item.total_score}점 ·
                      마진 {item.margin_rate}%
                    </p>
                  </article>
                ))}
                {projectCandidates.length === 0 && (
                  <div className="empty">아직 상품이 없습니다.</div>
                )}
              </div>
            )}
          </section>
        </div>

        <section className="card candidate-pool">
          <h3>저장된 후보</h3>
          <div className="results-grid">
            {candidates.map((candidate) => (
              <article className="result-card" key={candidate.id}>
                <h4>{candidate.name}</h4>
                <p>
                  {candidate.marketplace.toUpperCase()} · {candidate.total_score}점 ·
                  마진 {candidate.margin_rate}%
                </p>
                <button onClick={() => void attachCandidate(candidate.id)}>
                  선택 프로젝트에 추가
                </button>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
TSX

cat >> frontend/app/styles.css <<'CSS'

nav a{
  color:#9aa9c8;
  text-decoration:none;
}
.project-form{
  display:grid;
  gap:10px;
}
.project-list{
  display:grid;
  gap:8px;
  margin-top:18px;
}
.project-item{
  display:flex;
  justify-content:space-between;
  background:#101b31;
  color:#dbe5ff;
  border:1px solid #30436a;
}
.project-item.active{
  background:#203a69;
}
.project-item span{
  color:#94a6cf;
}
.candidate-pool{
  margin-top:18px;
}
CSS

cat > backend/tests/test_projects.py <<'PY'
from fastapi.testclient import TestClient

from app.main import app


def auth_headers(client: TestClient) -> dict[str, str]:
    login = client.post(
        "/api/v1/auth/login",
        json={
            "email": "admin@test.example.com",
            "password": "test-password",
        },
    )
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def test_project_candidate_workflow() -> None:
    with TestClient(app) as client:
        headers = auth_headers(client)

        project = client.post(
            "/api/v1/projects",
            headers=headers,
            json={"name": "Camping", "description": "Camping products"},
        )
        assert project.status_code == 201
        project_id = project.json()["id"]

        candidate = client.post(
            "/api/v1/sourcing/candidates",
            headers=headers,
            json={
                "name": "Camping Fan",
                "marketplace": "coupang",
                "country": "KR",
                "source_price": 20000,
                "target_price": 50000,
                "shipping_cost": 4000,
                "platform_fee_rate": 12,
                "ad_cost_rate": 5,
                "competition_score": 45,
                "trend_score": 80,
                "brand_score": 75,
            },
        )
        assert candidate.status_code == 201

        attached = client.post(
            f"/api/v1/projects/{project_id}/candidates",
            headers=headers,
            json={"candidate_id": candidate.json()["id"]},
        )
        assert attached.status_code == 204

        listed = client.get(
            f"/api/v1/projects/{project_id}/candidates",
            headers=headers,
        )
        assert listed.status_code == 200
        assert len(listed.json()) == 1
PY

cat >> CHANGELOG.md <<'MD'

## 1.3.0

- Added project creation and status model
- Added project-to-candidate assignment
- Added project candidate listing
- Added Projects dashboard page
- Added project workflow tests
MD

docker compose up -d --build backend frontend
sleep 10
docker compose run --rm backend pytest -v
docker compose ps

echo
echo "Project System v1.3 applied."
