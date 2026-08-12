"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api/backend";

type Candidate = { id: number; name: string; status: string; total_score: number; margin_rate: number; tags?: string };
type Project = { id: number; name: string; status: string };
type Staff = { id: string; name: string; domain: string };

const workflow = [
  { step: "1", title: "상품 후보 찾기", description: "팔아볼 상품을 검색하고 분석 결과를 저장합니다.", href: "/sourcing" },
  { step: "2", title: "수익성 점검", description: "예산·손실 한도·최소 마진을 확인합니다.", href: "/finance" },
  { step: "3", title: "판매 준비", description: "필수 정보를 채우고 승인 전 체크리스트를 완료합니다.", href: "/commerce" },
];

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "검토 대기", reviewing: "검토 중", on_hold: "보류", approved: "승인",
    rejected: "제외", selected: "선정", linked: "프로젝트 연결",
  };
  return labels[status] ?? status;
}

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
      setMessage("일부 정보를 불러오지 못했습니다. 잠시 후 새로고침하거나 로그인 상태를 확인하세요.");
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

  const nextAction = useMemo(() => {
    if (candidates.length === 0) return { label: "첫 상품 후보 찾기", detail: "아직 저장한 상품이 없습니다. 키워드 하나로 AI 분석을 시작해 보세요.", href: "/sourcing" };
    if (reviewCount > 0) return { label: `검토 대기 후보 ${reviewCount}개 정리하기`, detail: "후보를 선정·보류·제외로 구분하면 다음 단계가 명확해집니다.", href: "/sourcing" };
    if (selectedCount > 0 && financeReadyCount === 0) return { label: "선정 후보의 수익성 점검하기", detail: "최소 마진과 예산 기준을 통과한 후보만 판매 준비로 넘기세요.", href: "/finance" };
    if (financeReadyCount > 0) return { label: "판매 준비 체크리스트 열기", detail: "상품 정보가 충분한지 확인하고, 외부 등록 전 승인 단계를 준비하세요.", href: "/commerce" };
    return { label: "프로젝트 현황 확인하기", detail: "연결된 후보와 팀의 다음 작업을 확인하세요.", href: "/projects" };
  }, [candidates.length, financeReadyCount, reviewCount, selectedCount]);

  if (!ready) return null;

  if (!token) {
    return (
      <main className="login">
        <div className="card login-card">
          <h1>JARVIS <span>Commerce</span></h1>
          <p>상품 후보 발굴부터 수익성 점검, 판매 준비까지 한 화면에서 관리하는 운영 도구입니다.</p>
          <div className="login-hint"><strong>처음 실행하셨나요?</strong><br />로그인 화면에서 기본 계정으로 접속한 뒤, <b>상품 후보 찾기</b>부터 시작하세요.</div>
          <a className="button-link" href="/sourcing">로그인하고 시작하기</a>
        </div>
      </main>
    );
  }

  return (
    <AppShell active="dashboard" kicker="TODAY'S COMMAND CENTER" title="오늘 무엇부터 할까요?" description="복잡한 메뉴 대신, 지금 상태에서 가장 중요한 다음 행동부터 안내합니다." onLogout={clearSession}>
      {message && <p className="notice">{message}</p>}

      <section className="card start-card">
        <span className="status-pill">추천 다음 행동</span>
        <h3>{nextAction.label}</h3>
        <p>{nextAction.detail}</p>
        <a className="button-link" href={nextAction.href}>지금 시작하기</a>
      </section>

      <section className="metrics" aria-label="운영 현황">
        <article><span>저장한 후보</span><strong>{candidates.length}</strong><small className="metric-note">분석 목록에 저장된 상품</small></article>
        <article><span>결정이 필요한 후보</span><strong>{reviewCount}</strong><small className="metric-note">선정·보류·제외로 정리하세요</small></article>
        <article><span>판매 후보</span><strong>{selectedCount}</strong><small className="metric-note">선정 또는 프로젝트 연결 완료</small></article>
        <article><span>수익성 기준 통과</span><strong>{financeReadyCount}</strong><small className="metric-note">마진 25% 이상인 판매 후보</small></article>
      </section>

      <div className="dashboard-grid">
        <section className="card">
          <span className="kicker">처음이라면 이 순서로</span>
          <h3>상품을 판매 준비까지 보내는 3단계</h3>
          <div className="project-candidate-list">
            {workflow.map((item) => (
              <article className="project-candidate" key={item.step}>
                <span className="status-pill-neutral">STEP {item.step}</span>
                <h4>{item.title}</h4>
                <p>{item.description}</p>
                <a className="button-link secondary" href={item.href}>열기</a>
              </article>
            ))}
          </div>
        </section>

        <section className="card">
          <span className="kicker">우선 확인</span>
          <h3>점수가 높은 상품 후보</h3>
          <div className="project-candidate-list">
            {topCandidates.map((item) => (
              <article className="project-candidate" key={item.id}>
                <div className="result-top"><div><h4>{item.name}</h4><p>{statusLabel(item.status)}</p></div><div className="score">{item.total_score}</div></div>
                <p>예상 마진 <b>{item.margin_rate}%</b>{item.tags ? ` · ${item.tags}` : ""}</p>
              </article>
            ))}
            {topCandidates.length === 0 && <div className="empty">아직 후보가 없습니다. 왼쪽 메뉴의 <b>상품 후보 찾기</b>에서 키워드를 검색해 보세요.</div>}
          </div>
        </section>

        <section className="card">
          <span className="kicker">진행 중인 일</span>
          <h3>프로젝트</h3>
          <div className="project-list">
            {projects.map((item) => <a className="project-item" href="/projects" key={item.id}><strong>{item.name}</strong><span>{item.status}</span></a>)}
            {projects.length === 0 && <div className="empty">프로젝트가 아직 없습니다. 후보를 정리한 뒤 프로젝트를 만들어 묶어보세요.</div>}
          </div>
          <a className="button-link secondary" href="/projects" style={{ marginTop: 14 }}>프로젝트 관리 열기</a>
        </section>

        <section className="card">
          <span className="kicker">도움을 받을 수 있어요</span>
          <h3>AI 도우미</h3>
          <div className="project-list">
            {staff.map((item) => <a className="project-item" href="/ai-center" key={item.id}><strong>{item.name}</strong><span>{item.domain}</span></a>)}
            {staff.length === 0 && <div className="empty">AI 도우미 정보를 불러오는 중입니다.</div>}
          </div>
          <a className="button-link secondary" href="/ai-center" style={{ marginTop: 14 }}>AI 도우미 보기</a>
        </section>
      </div>
    </AppShell>
  );
}
