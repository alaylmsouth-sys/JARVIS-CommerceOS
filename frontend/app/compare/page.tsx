"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api/backend";
const MAX_COMPARE = 4;

type Candidate = {
  id: number;
  name: string;
  marketplace: string;
  country: string;
  status: string;
  source_price: number;
  shipping_cost: number;
  total_cost: number;
  target_price: number;
  gross_profit: number;
  margin_rate: number;
  total_score: number;
  competition_score: number;
  trend_score: number;
  brand_score: number;
  recommendation: string;
  explanation: string;
  tags: string;
  notes: string;
};

const statusLabels: Record<string, string> = {
  pending: "검토 대기", reviewing: "검토 중", on_hold: "보류", approved: "승인",
  rejected: "제외", selected: "선정", linked: "프로젝트 연결",
};

function money(value: number) {
  return Math.round(value).toLocaleString("ko-KR");
}

export default function ComparePage() {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
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

  async function loadCandidates() {
    const response = await fetch(`${API}/api/v1/sourcing/candidates`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (response.status === 401) return clearSession();
    if (!response.ok) return setMessage("후보 목록을 불러오지 못했습니다. 로그인 상태를 다시 확인하세요.");
    const result: Candidate[] = await response.json();
    const ranked = [...result].sort((a, b) => b.total_score - a.total_score);
    setCandidates(ranked);
    setSelectedIds(ranked.slice(0, Math.min(3, MAX_COMPARE)).map((item) => item.id));
  }

  function toggleCandidate(candidateId: number) {
    setMessage("");
    setSelectedIds((current) => {
      if (current.includes(candidateId)) return current.filter((id) => id !== candidateId);
      if (current.length >= MAX_COMPARE) {
        setMessage(`후보는 최대 ${MAX_COMPARE}개까지 비교할 수 있습니다.`);
        return current;
      }
      return [...current, candidateId];
    });
  }

  const selected = useMemo(
    () => selectedIds.map((id) => candidates.find((item) => item.id === id)).filter(Boolean) as Candidate[],
    [candidates, selectedIds],
  );
  const bestScore = Math.max(...selected.map((item) => item.total_score), 0);
  const bestMargin = Math.max(...selected.map((item) => item.margin_rate), 0);
  const bestProfit = Math.max(...selected.map((item) => item.gross_profit), 0);

  if (!ready) return null;
  if (!token) {
    return <main className="login"><div className="card login-card"><h1>JARVIS <span>Commerce</span></h1><p>상품 후보를 비교하려면 먼저 로그인하세요.</p><a className="button-link" href="/sourcing">로그인하고 후보 찾기</a></div></main>;
  }

  return (
    <AppShell active="compare" kicker="DECISION WORKSPACE" title="상품 후보를 나란히 비교하세요" description="점수 하나로 결정하지 말고, 단위 이익·마진·경쟁도·메모를 같은 기준으로 검토하세요." onLogout={clearSession}>
      {message && <p className="notice">{message}</p>}
      <section className="card compare-intro">
        <div><span className="status-pill">비교할 후보 {selected.length}/{MAX_COMPARE}</span><h3>선택한 후보의 차이를 한눈에 확인합니다</h3><p>점수는 판단을 돕는 신호일 뿐입니다. 공급처 근거와 판매 준비 상태를 함께 확인한 뒤 최종 결정하세요.</p></div>
        <div className="header-actions"><button className="secondary" onClick={() => setSelectedIds(candidates.slice(0, Math.min(3, MAX_COMPARE)).map((item) => item.id))}>상위 3개로 초기화</button><a className="button-link" href="/commerce">판매 준비로 이동</a></div>
      </section>

      <section className="card">
        <div className="section-heading"><div><span className="kicker">1. 비교할 후보 고르기</span><h3>최대 4개를 선택하세요</h3></div><span className="muted-copy">저장된 후보 {candidates.length}개</span></div>
        <div className="compare-picker">
          {candidates.map((item) => {
            const active = selectedIds.includes(item.id);
            return <button className={active ? "compare-choice active" : "compare-choice"} key={item.id} onClick={() => toggleCandidate(item.id)} aria-pressed={active}>
              <span className="choice-toggle">{active ? "선택됨" : "비교하기"}</span><b>{item.name}</b><small>{item.marketplace.toUpperCase()} · {statusLabels[item.status] ?? item.status} · {item.total_score}점</small>
            </button>;
          })}
          {candidates.length === 0 && <div className="empty">먼저 <a href="/sourcing">상품 후보 찾기</a>에서 분석 결과를 저장하세요.</div>}
        </div>
      </section>

      <section className="card comparison-table-wrap">
        <div className="section-heading"><div><span className="kicker">2. 근거 비교</span><h3>선택한 후보 비교표</h3></div><span className="muted-copy">높은 값이 항상 더 좋은 것은 아닙니다.</span></div>
        {selected.length > 0 ? <div className="comparison-scroll"><table className="comparison-table"><thead><tr><th>비교 기준</th>{selected.map((item) => <th key={item.id}><strong>{item.name}</strong><small>{item.marketplace.toUpperCase()} · {item.country}</small></th>)}</tr></thead><tbody>
          <tr><th>후보 상태</th>{selected.map((item) => <td key={item.id}>{statusLabels[item.status] ?? item.status}</td>)}</tr>
          <tr><th>종합 점수</th>{selected.map((item) => <td className={item.total_score === bestScore ? "best-value" : ""} key={item.id}>{item.total_score}점{item.total_score === bestScore && <small>선택 후보 중 최고</small>}</td>)}</tr>
          <tr><th>예상 마진률</th>{selected.map((item) => <td className={item.margin_rate === bestMargin ? "best-value" : ""} key={item.id}>{item.margin_rate}%{item.margin_rate === bestMargin && <small>선택 후보 중 최고</small>}</td>)}</tr>
          <tr><th>단위 이익</th>{selected.map((item) => <td className={item.gross_profit === bestProfit ? "best-value" : ""} key={item.id}>{money(item.gross_profit)}{item.gross_profit === bestProfit && <small>선택 후보 중 최고</small>}</td>)}</tr>
          <tr><th>예상 판매가</th>{selected.map((item) => <td key={item.id}>{money(item.target_price)}</td>)}</tr>
          <tr><th>총 원가</th>{selected.map((item) => <td key={item.id}>{money(item.total_cost)}</td>)}</tr>
          <tr><th>경쟁도 점수</th>{selected.map((item) => <td key={item.id}>{item.competition_score}점</td>)}</tr>
          <tr><th>트렌드 점수</th>{selected.map((item) => <td key={item.id}>{item.trend_score}점</td>)}</tr>
          <tr><th>브랜드 적합도</th>{selected.map((item) => <td key={item.id}>{item.brand_score}점</td>)}</tr>
          <tr><th>태그</th>{selected.map((item) => <td key={item.id}>{item.tags || "미입력"}</td>)}</tr>
          <tr><th>검토 메모</th>{selected.map((item) => <td key={item.id}>{item.notes || "미입력"}</td>)}</tr>
          <tr><th>AI 분석 근거</th>{selected.map((item) => <td key={item.id}>{item.explanation}</td>)}</tr>
        </tbody></table></div> : <div className="empty">비교할 후보를 하나 이상 선택하세요.</div>}
      </section>

      <section className="card compare-next-step"><div><span className="kicker">3. 다음 단계</span><h3>선택 전 확인할 질문</h3><p>공급처 가격과 재고가 최신인가요? 광고비와 반품 가능성을 포함해도 마진이 남나요? 선택한 후보의 준비 항목을 모두 확인했나요?</p></div><a className="button-link" href="/commerce">판매 준비 체크리스트 열기</a></section>
    </AppShell>
  );
}
