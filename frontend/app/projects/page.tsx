"use client";

import { FormEvent, useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api/backend";

type Project = {
  id: number;
  name: string;
  description: string | null;
  status: "active" | "paused" | "completed";
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
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [projectCandidates, setProjectCandidates] = useState<Candidate[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setToken(localStorage.getItem("jarvis_token") ?? "");
    setReady(true);
  }, []);

  useEffect(() => {
    if (token) {
      void loadProjects();
      void loadCandidates();
    }
  }, [token]);

  function clearSession() {
    localStorage.removeItem("jarvis_token");
    setToken("");
  }

  async function authFetch(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    headers.set("authorization", `Bearer ${token}`);
    if (init.body) headers.set("content-type", "application/json");

    const response = await fetch(`${API}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
    if (response.status === 401) clearSession();
    return response;
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
    setMessage("");
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

    const created: Project = await response.json();
    setName("");
    setDescription("");
    setMessage("프로젝트를 생성했습니다.");
    await loadProjects();
    await selectProject(created.id);
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
      setMessage(`후보 추가 실패: ${await response.text()}`);
      return;
    }

    setMessage("후보를 프로젝트에 추가했습니다.");
    await selectProject(selectedProject);
  }

  if (!ready) return null;

  if (!token) {
    return (
      <main className="login">
        <div className="card login-card">
          <h1>JARVIS</h1>
          <p>프로젝트를 사용하려면 먼저 로그인하세요.</p>
          <a className="button-link" href="/sourcing">
            로그인 화면으로 이동
          </a>
        </div>
      </main>
    );
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
          <span>AI Center</span>
          <span>Settings</span>
        </nav>
      </aside>

      <div className="page projects-page">
        <header>
          <div>
            <small>PROJECT SYSTEM</small>
            <h2>Projects</h2>
            <p>저장된 상품 후보를 프로젝트별로 묶어 관리합니다.</p>
          </div>
          <button className="secondary" onClick={clearSession}>
            로그아웃
          </button>
        </header>

        <div className="workspace">
          <div className="card">
            <h3>새 프로젝트</h3>
            <form onSubmit={createProject} className="project-form">
              <input
                required
                minLength={2}
                placeholder="예: 캠핑용품"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <input
                placeholder="프로젝트 설명"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
              <button>프로젝트 생성</button>
            </form>

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
              {projects.length === 0 && (
                <div className="empty">첫 프로젝트를 만들어 보세요.</div>
              )}
            </div>
          </div>

          <div className="card">
            <h3>프로젝트 상품</h3>
            {!selectedProject ? (
              <div className="empty">왼쪽에서 프로젝트를 선택하세요.</div>
            ) : (
              <div className="project-candidate-list">
                {projectCandidates.map((item) => (
                  <article className="project-candidate" key={item.id}>
                    <h4>{item.name}</h4>
                    <p>
                      {item.marketplace.toUpperCase()} · {item.total_score}점 · 마진{" "}
                      {item.margin_rate}%
                    </p>
                  </article>
                ))}
                {projectCandidates.length === 0 && (
                  <div className="empty">아직 추가된 후보가 없습니다.</div>
                )}
              </div>
            )}
          </div>
        </div>

        {message && <p className="notice">{message}</p>}

        <div className="card candidate-pool">
          <h3>저장된 후보</h3>
          <div className="results-grid">
            {candidates.map((candidate) => (
              <article className="project-candidate" key={candidate.id}>
                <h4>{candidate.name}</h4>
                <p>
                  {candidate.marketplace.toUpperCase()} · {candidate.total_score}점 · 마진{" "}
                  {candidate.margin_rate}%
                </p>
                <button onClick={() => void attachCandidate(candidate.id)}>
                  선택 프로젝트에 추가
                </button>
              </article>
            ))}
            {candidates.length === 0 && (
              <div className="empty">AI Sourcing에서 후보를 먼저 저장하세요.</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
