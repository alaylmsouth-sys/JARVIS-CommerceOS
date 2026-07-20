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
};

type FinanceRow = Candidate & {
  unitCashOut: number;
  maxUnits: number;
  testCashOut: number;
  expectedProfit: number;
  worstCaseLoss: number;
  verdict: "go" | "watch" | "stop";
};

function money(value: number) {
  return Math.round(value).toLocaleString("ko-KR");
}

function verdictLabel(value: FinanceRow["verdict"]) {
  if (value === "go") return "테스트 가능";
  if (value === "watch") return "조건부 검토";
  return "보류";
}

export default function FinancePage() {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [budget, setBudget] = useState(300000);
  const [maxLossRate, setMaxLossRate] = useState(30);
  const [minMargin, setMinMargin] = useState(25);
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
      setMessage("후보 재무 데이터를 불러오지 못했습니다.");
      return;
    }
    setCandidates(await response.json());
  }

  const rows = useMemo<FinanceRow[]>(() => {
    const maxLossBudget = budget * (maxLossRate / 100);
    return candidates
      .map((candidate) => {
        const unitCashOut = Math.max(candidate.total_cost || candidate.source_price + candidate.shipping_cost, 1);
        const maxUnits = Math.max(Math.floor(budget / unitCashOut), 0);
        const testUnits = Math.min(maxUnits, 10);
        const testCashOut = testUnits * unitCashOut;
        const expectedProfit = testUnits * candidate.gross_profit;
        const worstCaseLoss = testCashOut;
        const verdict: FinanceRow["verdict"] =
          candidate.margin_rate >= minMargin && worstCaseLoss <= maxLossBudget && testUnits > 0
            ? "go"
            : candidate.margin_rate >= minMargin * 0.8 && testUnits > 0
              ? "watch"
              : "stop";
        return { ...candidate, unitCashOut, maxUnits: testUnits, testCashOut, expectedProfit, worstCaseLoss, verdict };
      })
      .sort((a, b) => {
        const rank = { go: 3, watch: 2, stop: 1 };
        return rank[b.verdict] - rank[a.verdict] || b.expectedProfit - a.expectedProfit;
      });
  }, [budget, candidates, maxLossRate, minMargin]);

  const goRows = rows.filter((item) => item.verdict === "go");
  const totalPlannedCash = goRows.reduce((sum, item) => sum + item.testCashOut, 0);
  const totalExpectedProfit = goRows.reduce((sum, item) => sum + item.expectedProfit, 0);
  const maxLossBudget = budget * (maxLossRate / 100);

  if (!ready) return null;

  if (!token) {
    return (
      <main className="login">
        <div className="card login-card">
          <h1>JARVIS</h1>
          <p>Finance를 사용하려면 먼저 로그인하세요.</p>
          <a className="button-link" href="/sourcing">로그인 화면으로 이동</a>
        </div>
      </main>
    );
  }

  return (
    <AppShell active="finance" kicker="FINANCE CONTROL" title="Finance" description="후보와 프로젝트를 돈, 예산, 손실한도 기준으로 걸러냅니다." onLogout={clearSession}>
      {message && <p className="notice">{message}</p>}

      <section className="metrics">
        <article><span>실험 예산</span><strong>{money(budget)}</strong></article>
        <article><span>최대 손실 한도</span><strong>{money(maxLossBudget)}</strong></article>
        <article><span>테스트 가능 후보</span><strong>{goRows.length}</strong></article>
        <article><span>예상 순이익</span><strong>{money(totalExpectedProfit)}</strong></article>
      </section>

      <div className="dashboard-grid">
        <section className="card">
          <h3>가드레일</h3>
          <form className="finance-controls">
            <label>
              <span>실험 예산</span>
              <input type="number" min={0} step={10000} value={budget} onChange={(event) => setBudget(Number(event.target.value))} />
            </label>
            <label>
              <span>최대 손실률 (%)</span>
              <input type="number" min={0} max={100} value={maxLossRate} onChange={(event) => setMaxLossRate(Number(event.target.value))} />
            </label>
            <label>
              <span>최소 마진률 (%)</span>
              <input type="number" min={0} max={100} value={minMargin} onChange={(event) => setMinMargin(Number(event.target.value))} />
            </label>
          </form>
          <div className="project-candidate-list">
            <article className="project-candidate"><h4>현금 지출 계획</h4><p>테스트 가능 후보 기준 {money(totalPlannedCash)}원을 사용합니다.</p></article>
            <article className="project-candidate"><h4>손실 방어선</h4><p>후보별 최악 손실이 {money(maxLossBudget)}원을 넘으면 자동 보류합니다.</p></article>
          </div>
        </section>

        <section className="card">
          <h3>추천 테스트</h3>
          <div className="project-candidate-list">
            {goRows.slice(0, 4).map((item) => (
              <article className="project-candidate" key={item.id}>
                <h4>{item.name}</h4>
                <p>{item.maxUnits}개 테스트 · 현금 {money(item.testCashOut)} · 예상 순이익 {money(item.expectedProfit)}</p>
              </article>
            ))}
            {goRows.length === 0 && <div className="empty">현재 가드레일 안에서 바로 테스트 가능한 후보가 없습니다.</div>}
          </div>
        </section>
      </div>

      <section className="card candidate-pool">
        <h3>후보별 재무 판정</h3>
        <div className="results-grid">
          {rows.map((item) => (
            <article className="project-candidate finance-row" key={item.id}>
              <div className="result-top">
                <div><small>{item.marketplace.toUpperCase()} · {item.status}</small><h4>{item.name}</h4></div>
                <strong>{verdictLabel(item.verdict)}</strong>
              </div>
              <div className="stats">
                <span>단위 현금지출 <b>{money(item.unitCashOut)}</b></span>
                <span>테스트 수량 <b>{item.maxUnits}</b></span>
                <span>총 테스트 지출 <b>{money(item.testCashOut)}</b></span>
                <span>예상 순이익 <b>{money(item.expectedProfit)}</b></span>
                <span>마진률 <b>{item.margin_rate}%</b></span>
                <span>최악 손실 <b>{money(item.worstCaseLoss)}</b></span>
              </div>
              {item.tags && <p>태그: {item.tags}</p>}
            </article>
          ))}
          {rows.length === 0 && <div className="empty">AI Sourcing에서 후보를 먼저 저장하세요.</div>}
        </div>
      </section>
    </AppShell>
  );
}
