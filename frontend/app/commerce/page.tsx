"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api/backend";

type Candidate = {
  id: number;
  name: string;
  marketplace: string;
  status: string;
  source_price: number;
  target_price: number;
  shipping_cost: number;
  total_cost: number;
  gross_profit: number;
  margin_rate: number;
  total_score: number;
  tags?: string;
  notes?: string;
};

type CommerceRow = Candidate & {
  readiness: number;
  verdict: "ready" | "review" | "blocked";
  checklist: { label: string; passed: boolean }[];
  channels: string[];
};

function money(value: number) {
  return Math.round(value).toLocaleString("ko-KR");
}

function verdictLabel(value: CommerceRow["verdict"]) {
  if (value === "ready") return "등록 준비";
  if (value === "review") return "검토 필요";
  return "보류";
}

function channelAssumptions(candidate: Candidate) {
  const channels = [candidate.marketplace.toUpperCase()];
  if (candidate.margin_rate >= 30) channels.push("자사몰 테스트");
  if (candidate.total_score >= 70) channels.push("콘텐츠 광고 후보");
  return channels;
}

export default function CommercePage() {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [minScore, setMinScore] = useState(65);
  const [minMargin, setMinMargin] = useState(25);
  const [requireSelection, setRequireSelection] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setToken(localStorage.getItem("jarvis_token") ?? "");
    setReady(true);
  }, []);

  useEffect(() => {
    if (token) void loadCandidates();
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

  async function loadCandidates() {
    setMessage("");
    const response = await authFetch("/api/v1/sourcing/candidates");
    if (!response.ok) {
      setMessage("상품 준비 데이터를 불러오지 못했습니다.");
      return;
    }
    setCandidates(await response.json());
  }

  const rows = useMemo<CommerceRow[]>(() => {
    return candidates
      .map((candidate) => {
        const selected = ["selected", "linked", "approved"].includes(candidate.status);
        const checklist = [
          { label: "후보 선정 상태", passed: requireSelection ? selected : true },
          { label: "최소 종합점수", passed: candidate.total_score >= minScore },
          { label: "최소 마진률", passed: candidate.margin_rate >= minMargin },
          { label: "판매가 존재", passed: candidate.target_price > 0 },
          { label: "원가와 배송비 존재", passed: candidate.source_price > 0 && candidate.shipping_cost >= 0 },
        ];
        const passed = checklist.filter((item) => item.passed).length;
        const readiness = Math.round((passed / checklist.length) * 100);
        const verdict: CommerceRow["verdict"] = readiness >= 100 ? "ready" : readiness >= 70 ? "review" : "blocked";
        return { ...candidate, checklist, readiness, verdict, channels: channelAssumptions(candidate) };
      })
      .sort((a, b) => b.readiness - a.readiness || b.total_score - a.total_score);
  }, [candidates, minMargin, minScore, requireSelection]);

  const readyRows = rows.filter((item) => item.verdict === "ready");
  const reviewRows = rows.filter((item) => item.verdict === "review");
  const blockedRows = rows.filter((item) => item.verdict === "blocked");
  const estimatedGrossProfit = readyRows.reduce((sum, item) => sum + item.gross_profit, 0);

  if (!ready) return null;

  if (!token) {
    return (
      <main className="login">
        <div className="card login-card">
          <h1>JARVIS</h1>
          <p>Commerce를 사용하려면 먼저 로그인하세요.</p>
          <a className="button-link" href="/sourcing">로그인 화면으로 이동</a>
        </div>
      </main>
    );
  }

  return (
    <AppShell active="commerce" kicker="COMMERCE OPS" title="Commerce" description="재무 조건을 통과한 후보를 상품 등록 준비, 채널 가정, 승인 게이트 기준으로 정리합니다." onLogout={clearSession}>
      {message && <p className="notice">{message}</p>}

      <section className="metrics">
        <article><span>등록 준비</span><strong>{readyRows.length}</strong></article>
        <article><span>검토 필요</span><strong>{reviewRows.length}</strong></article>
        <article><span>보류</span><strong>{blockedRows.length}</strong></article>
        <article><span>예상 단위 이익</span><strong>{money(estimatedGrossProfit)}</strong></article>
      </section>

      <div className="dashboard-grid">
        <section className="card">
          <h3>등록 기준</h3>
          <form className="commerce-controls">
            <label>
              <span>최소 종합점수</span>
              <input type="number" min={0} max={100} value={minScore} onChange={(event) => setMinScore(Number(event.target.value))} />
            </label>
            <label>
              <span>최소 마진률 (%)</span>
              <input type="number" min={0} max={100} value={minMargin} onChange={(event) => setMinMargin(Number(event.target.value))} />
            </label>
            <label className="toggle-line">
              <input type="checkbox" checked={requireSelection} onChange={(event) => setRequireSelection(event.target.checked)} />
              <span>선정 후보만 준비 완료 허용</span>
            </label>
          </form>
          <div className="project-candidate-list">
            <article className="project-candidate"><h4>명시 승인 게이트</h4><p>이 화면은 등록 준비도만 계산합니다. 실제 마켓 등록, 가격 변경, 재고 반영은 사용자 승인 전 실행하지 않습니다.</p></article>
            <article className="project-candidate"><h4>다음 연결</h4><p>준비 완료 후보는 Media Studio의 상세페이지 문안과 Commerce 어댑터 구현 대상으로 넘깁니다.</p></article>
          </div>
        </section>

        <section className="card">
          <h3>준비 완료 후보</h3>
          <div className="project-candidate-list">
            {readyRows.slice(0, 4).map((item) => (
              <article className="project-candidate" key={item.id}>
                <h4>{item.name}</h4>
                <p>{item.total_score}점 · 마진 {item.margin_rate}% · 단위 이익 {money(item.gross_profit)}</p>
                <div className="channel-row">{item.channels.map((channel) => <span key={channel}>{channel}</span>)}</div>
              </article>
            ))}
            {readyRows.length === 0 && <div className="empty">현재 기준에서 바로 등록 준비 완료된 후보가 없습니다.</div>}
          </div>
        </section>
      </div>

      <section className="card candidate-pool">
        <h3>상품 등록 준비도</h3>
        <div className="results-grid">
          {rows.map((item) => (
            <article className="project-candidate commerce-row" key={item.id}>
              <div className="result-top">
                <div><small>{item.marketplace.toUpperCase()} · {item.status}</small><h4>{item.name}</h4></div>
                <strong>{verdictLabel(item.verdict)}</strong>
              </div>
              <div className="readiness-bar"><span style={{ width: `${item.readiness}%` }} /></div>
              <p>준비도 {item.readiness}% · 판매가 {money(item.target_price)} · 총 원가 {money(item.total_cost)} · 마진 {item.margin_rate}%</p>
              <div className="checklist">
                {item.checklist.map((check) => (
                  <span className={check.passed ? "passed" : "missing"} key={check.label}>{check.passed ? "OK" : "확인"} · {check.label}</span>
                ))}
              </div>
              <div className="channel-row">{item.channels.map((channel) => <span key={channel}>{channel}</span>)}</div>
            </article>
          ))}
          {rows.length === 0 && <div className="empty">AI Sourcing에서 후보를 먼저 저장하세요.</div>}
        </div>
      </section>
    </AppShell>
  );
}
