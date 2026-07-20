"use client";

import { FormEvent, useEffect, useState } from "react";

import { AppShell } from "../components/AppShell";

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
  country?: string;
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
  const [busy, setBusy] = useState(false);

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
    const response = await fetch(`${API}${path}`, { ...init, headers, cache: "no-store" });
    if (response.status === 401) clearSession();
    return response;
  }

  async function loadProjects() {
    const response = await authFetch("/api/v1/projects");
    if (!response.ok) return;
    const data: Project[] = await response.json();
    setProjects(data);
    if (selectedProject === null && data.length > 0) {
      await selectProject(data[0].id);
    }
  }

  async function loadCandidates() {
    const response = await authFetch("/api/v1/sourcing/candidates");
    if (response.ok) setCandidates(await response.json());
  }

  async function createProject(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const response = await authFetch("/api/v1/projects", {
      method: "POST",
      body: JSON.stringify({ name, description: description || null }),
    });
    setBusy(false);

    if (response.status === 409) {
      setMessage("A project with this name already exists.");
      return;
    }
    if (!response.ok) {
      setMessage(`Project creation failed: ${await response.text()}`);
      return;
    }

    const created: Project = await response.json();
    setName("");
    setDescription("");
    setMessage("Project created.");
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
      setMessage("Select a project first.");
      return;
    }

    setBusy(true);
    setMessage("");
    const response = await authFetch(`/api/v1/projects/${selectedProject}/candidates`, {
      method: "POST",
      body: JSON.stringify({ candidate_id: candidateId }),
    });
    setBusy(false);

    if (response.status === 409) {
      setMessage("This candidate is already in the selected project.");
      return;
    }
    if (!response.ok) {
      setMessage(`Candidate attach failed: ${await response.text()}`);
      return;
    }

    setMessage("Candidate added to project.");
    await selectProject(selectedProject);
  }

  if (!ready) return null;

  if (!token) {
    return (
      <main className="login">
        <div className="card login-card">
          <h1>JARVIS</h1>
          <p>Log in from AI Sourcing before opening Projects.</p>
          <a className="button-link" href="/sourcing">
            Go to login
          </a>
        </div>
      </main>
    );
  }

  return (
    <AppShell
      active="projects"
      kicker="PROJECT SYSTEM"
      title="Projects"
      description="Group saved sourcing candidates by project."
      onLogout={clearSession}
    >
      <div className="workspace">
        <div className="card">
          <h3>Create Project</h3>
          <form onSubmit={createProject} className="project-form">
            <input
              required
              minLength={2}
              placeholder="Project name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <input
              placeholder="Description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            <button disabled={busy}>{busy ? "Working..." : "Create"}</button>
          </form>
          <div className="project-list">
            {projects.map((project) => (
              <button
                key={project.id}
                className={selectedProject === project.id ? "project-item active" : "project-item"}
                onClick={() => void selectProject(project.id)}
              >
                <strong>{project.name}</strong>
                <span>{project.status}</span>
              </button>
            ))}
            {projects.length === 0 && <div className="empty">No projects yet.</div>}
          </div>
        </div>

        <div className="card">
          <h3>Project Candidates</h3>
          {!selectedProject ? (
            <div className="empty">Select a project.</div>
          ) : (
            <div className="project-candidate-list">
              {projectCandidates.map((candidate) => (
                <article className="project-candidate" key={candidate.id}>
                  <h4>{candidate.name}</h4>
                  <p>
                    {candidate.marketplace.toUpperCase()} / score {candidate.total_score} / margin{" "}
                    {candidate.margin_rate}%
                  </p>
                </article>
              ))}
              {projectCandidates.length === 0 && <div className="empty">No candidates in this project.</div>}
            </div>
          )}
        </div>
      </div>

      {message && <p className="notice">{message}</p>}

      <div className="card candidate-pool">
        <h3>Saved Candidates</h3>
        <div className="results-grid">
          {candidates.map((candidate) => (
            <article className="project-candidate" key={candidate.id}>
              <h4>{candidate.name}</h4>
              <p>
                {candidate.marketplace.toUpperCase()} / score {candidate.total_score} / margin {candidate.margin_rate}%
              </p>
              <button disabled={busy || !selectedProject} onClick={() => void attachCandidate(candidate.id)}>
                Add to Project
              </button>
            </article>
          ))}
          {candidates.length === 0 && <div className="empty">Save candidates in AI Sourcing first.</div>}
        </div>
      </div>
    </AppShell>
  );
}
