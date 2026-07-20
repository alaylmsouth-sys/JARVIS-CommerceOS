"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api/backend";

type Candidate = { id: number; name: string; status: string; total_score: number; margin_rate: number; tags?: string };
type Project = { id: number; name: string; status: string };
type Staff = { id: string; name: string; domain: string };

const steps = [
  "기반 안정화",
  "AI Sourcing 고도화",
  "Projects 실사용화",
  "Finance 가드레일",
  "Commerce 운영 모듈",
  "운영 전환",
];

export default function DashboardPage() {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setToken(localStorage.getItem("jarvis_token") ?? "");
    setReady(true);
  }, []);

  useEffect(() => {
    if (token) void loadDashboard();
  }, [token]);

  function clearSession() {
    localStorage.removeItem("jarvis_token");
    setToken("");
  }

  async function authFetch(path: string) {
    const response = await fetch(`${API}${path}`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (response.status === 401) clearSession();
    return response;
  }

  async function loadDashboard() {
    setMessage("");
    const [candidateResponse, projectResponse, staffResponse] = await Promise.all([
      authFetch("/api/v1/sourcing/candidates"),
      authFetch("/api/v1/projects"),
      authFetch("/api/v1/ai-center/staff"),
    ]);
    if (candidateResponse.ok) setCandidates(await candidateResponse.json());
    if (projectResponse.ok) setProjects(await projectResponse.json());
    if (staffResponse.ok) setStaff(await staffResponse.json());
    if (!candidateResponse.ok || !projectResponse.ok || !staffResponse.ok) {
      setMessage("일부 조종석 데이터를 불러오지 못했습니다.");
    }
  }

  const selectedCount = useMemo(
    () => candidates.filter((item) => ["selected", "linked", "approved"].includes(item.status)).length,
    [candidates],
  );
  const reviewCount = useMemo(
    () => candidates.filter((item) => ["pending", "reviewing", "on_hold"].includes(item.status)).length,
    [candidates],
  );
  const financeReadyCount = useMemo(
    () => candidates.filter((item) => item.margin_rate >= 25 && ["selected", "linked", "approved"].includes(item.status)).length,
    [candidates],
  );
  const topCandidates = [...candidates].sort((a, b) => b.total_score - a.total_score).slice(0, 4);

  if (!ready) return null;

  if (!token) {
    return (
      <main className="login">
        <div className="card login-card">
          <h1>JARVIS</h1>
          <p>조종석을 사용하려면 먼저 로그인하세요.</p>
          <a className="button-link" href="/sourcing">로그인 화면으로 이동</a>
        </div>
      </main>
    );
  }

  return (
    <AppShell active="dashboard" kicker="COMMAND COCKPIT" title="JARVIS Dashboard" description="소싱, 프로젝트, AI 직원, 재무 가드레일, 커머스 준비 상태를 한 화면에서 봅니다." onLogout={clearSession}>
      {message && <p className="notice">{message}</p>}

      <section className="metrics">
        <article><span>저장 후보</span><strong>{candidates.length}</strong></article>
        <article><span>검토 중</span><strong>{reviewCount}</strong></article>
        <article><span>선정 후보</span><strong>{selectedCount}</strong></article>
        <article><span>재무 검토 가능</span><strong>{financeReadyCount}</strong></article>
      </section>

      <div className="dashboard-grid">
        <section className="card">
          <h3>다음 행동</h3>
          <div className="project-candidate-list">
            <article className="project-candidate"><h4>1. 후보 정리</h4><p>저장 후보를 검토중, 보류, 선정, 폐기로 나눕니다.</p></article>
            <article className="project-candidate"><h4>2. 재무 가드레일</h4><p>Finance에서 예산, 손실한도, 최소 마진을 통과하는 후보만 추립니다.</p><a className="button-link secondary" href="/finance">Finance 열기</a></article>
            <article className="project-candidate"><h4>3. 상품 등록 준비</h4><p>Commerce에서 체크리스트와 승인 게이트를 확인합니다.</p><a className="button-link secondary" href="/commerce">Commerce 열기</a></article>
          </div>
        </section>

        <section className="card">
          <h3>상위 후보</h3>
          <div className="project-candidate-list">
            {topCandidates.map((item) => (
              <article className="project-candidate" key={item.id}>
                <h4>{item.name}</h4>
                <p>{item.total_score}점 · 마진 {item.margin_rate}% · {item.status}</p>
              </article>
            ))}
            {topCandidates.length === 0 && <div className="empty">AI Sourcing에서 후보를 저장하세요.</div>}
          </div>
        </section>

        <section className="card">
          <h3>AI 직원</h3>
          <div className="project-list">
            {staff.map((item) => (
              <a className="project-item" href="/ai-center" key={item.id}>
                <strong>{item.name}</strong><span>{item.domain}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="card">
          <h3>6단계 청사진</h3>
          <div className="project-list">
            {steps.map((item, index) => (
              <div className="project-item" key={item}>
                <strong>{index + 1}. {item}</strong><span>{index < 5 ? "active" : "planned"}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
