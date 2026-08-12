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

type ChecklistKey = "copy_ready" | "images_ready" | "supplier_confirmed" | "inventory_confirmed" | "pricing_confirmed" | "policy_checked";
type Checklist = Record<ChecklistKey, boolean> & { candidate_id: number; notes: string; updated_at?: string | null };
type CheckItem = { label: string; passed: boolean; source: "system" | "manual" };
type CommerceRow = Candidate & { readiness: number; verdict: "ready" | "review" | "blocked"; checklist: CheckItem[]; channels: string[]; manualDone: number };

const manualChecklist: { key: ChecklistKey; label: string; help: string }[] = [
  { key: "copy_ready", label: "상품명·상세 문안 준비", help: "고객에게 보여줄 핵심 설명을 작성했습니다." },
  { key: "images_ready", label: "이미지 자료 준비", help: "대표 이미지와 필요한 상세 이미지를 확보했습니다." },
  { key: "supplier_confirmed", label: "공급처 조건 확인", help: "매입 단가, 최소 주문 수량, 납기 조건을 확인했습니다." },
  { key: "inventory_confirmed", label: "초기 재고 확인", help: "판매 시작에 필요한 재고 수량을 확인했습니다." },
  { key: "pricing_confirmed", label: "판매 가격 재확인", help: "수수료·광고비·배송비를 포함해 최종 가격을 검토했습니다." },
  { key: "policy_checked", label: "판매 정책 확인", help: "카테고리 제한, 인증, 반품 기준을 확인했습니다." },
];

function emptyChecklist(candidateId: number): Checklist {
  return { candidate_id: candidateId, copy_ready: false, images_ready: false, supplier_confirmed: false, inventory_confirmed: false, pricing_confirmed: false, policy_checked: false, notes: "" };
}

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
  const [drafts, setDrafts] = useState<Record<number, Checklist>>({});
  const [minScore, setMinScore] = useState(65);
  const [minMargin, setMinMargin] = useState(25);
  const [requireSelection, setRequireSelection] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setToken(localStorage.getItem("jarvis_token") ?? "");
    setReady(true);
  }, []);

  useEffect(() => {
    if (token) void loadCommerceData();
  }, [token]);

  function clearSession() {
    localStorage.removeItem("jarvis_token");
    setToken("");
  }

  async function authFetch(path: string, init?: RequestInit) {
    const response = await fetch(`${API}${path}`, {
      ...init,
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (response.status === 401) clearSession();
    return response;
  }

  async function loadCommerceData() {
    setMessage("");
    const [candidateResponse, checklistResponse] = await Promise.all([
      authFetch("/api/v1/sourcing/candidates"),
      authFetch("/api/v1/sourcing/checklists"),
    ]);
    if (!candidateResponse.ok || !checklistResponse.ok) {
      setMessage("판매 준비 데이터를 불러오지 못했습니다. 로그인 상태를 다시 확인하세요.");
      return;
    }
    const candidateRows: Candidate[] = await candidateResponse.json();
    const savedRows: Checklist[] = await checklistResponse.json();
    const byCandidate: Record<number, Checklist> = {};
    candidateRows.forEach((candidate) => { byCandidate[candidate.id] = emptyChecklist(candidate.id); });
    savedRows.forEach((item) => { byCandidate[item.candidate_id] = item; });
    setCandidates(candidateRows);
    setDrafts(byCandidate);
  }

  function updateDraft(candidateId: number, patch: Partial<Checklist>) {
    setDrafts((current) => ({ ...current, [candidateId]: { ...(current[candidateId] ?? emptyChecklist(candidateId)), ...patch } }));
  }

  async function saveChecklist(candidateId: number) {
    const draft = drafts[candidateId] ?? emptyChecklist(candidateId);
    setSavingId(candidateId);
    setMessage("");
    const response = await authFetch(`/api/v1/sourcing/candidates/${candidateId}/checklist`, {
      method: "PUT",
      body: JSON.stringify(manualChecklist.reduce((payload, item) => ({ ...payload, [item.key]: draft[item.key] }), { notes: draft.notes })),
    });
    setSavingId(null);
    if (!response.ok) {
      setMessage("체크리스트를 저장하지 못했습니다. 잠시 후 다시 시도하세요.");
      return;
    }
    const saved: Checklist = await response.json();
    setDrafts((current) => ({ ...current, [candidateId]: saved }));
    setMessage("판매 준비 체크리스트를 저장했습니다.");
  }

  const rows = useMemo<CommerceRow[]>(() => candidates.map((candidate) => {
    const selected = ["selected", "linked", "approved"].includes(candidate.status);
    const draft = drafts[candidate.id] ?? emptyChecklist(candidate.id);
    const systemChecks: CheckItem[] = [
      { label: "후보 선정 상태", passed: requireSelection ? selected : true, source: "system" },
      { label: "최소 종합점수", passed: candidate.total_score >= minScore, source: "system" },
      { label: "최소 마진률", passed: candidate.margin_rate >= minMargin, source: "system" },
      { label: "판매가 존재", passed: candidate.target_price > 0, source: "system" },
      { label: "원가와 배송비 존재", passed: candidate.source_price > 0 && candidate.shipping_cost >= 0, source: "system" },
    ];
    const manualChecks: CheckItem[] = manualChecklist.map((item) => ({ label: item.label, passed: draft[item.key], source: "manual" }));
    const checklist = [...systemChecks, ...manualChecks];
    const passed = checklist.filter((item) => item.passed).length;
    const readiness = Math.round((passed / checklist.length) * 100);
    const verdict: CommerceRow["verdict"] = readiness === 100 ? "ready" : readiness >= 65 ? "review" : "blocked";
    return { ...candidate, checklist, readiness, verdict, channels: channelAssumptions(candidate), manualDone: manualChecks.filter((item) => item.passed).length };
  }).sort((a, b) => b.readiness - a.readiness || b.total_score - a.total_score), [candidates, drafts, minMargin, minScore, requireSelection]);

  const readyRows = rows.filter((item) => item.verdict === "ready");
  const reviewRows = rows.filter((item) => item.verdict === "review");
  const blockedRows = rows.filter((item) => item.verdict === "blocked");
  const estimatedGrossProfit = readyRows.reduce((sum, item) => sum + item.gross_profit, 0);

  if (!ready) return null;
  if (!token) return <main className="login"><div className="card login-card"><h1>JARVIS <span>Commerce</span></h1><p>판매 준비 기능을 사용하려면 먼저 로그인하세요.</p><a className="button-link" href="/sourcing">로그인 화면으로 이동</a></div></main>;

  return (
    <AppShell active="commerce" kicker="STEP 4 · LAUNCH READINESS" title="판매 준비를 하나씩 확인하세요" description="후보 비교로 결정 근거를 확인한 뒤, 상품·공급·재고·가격·정책 항목을 실제로 체크하고 저장합니다." onLogout={clearSession}>
      {message && <p className="notice">{message}</p>}
      <section className="card start-card commerce-start-card"><div><span className="status-pill">안전한 등록 준비</span><h3>비교하고, 확인하고, 마지막에 승인하세요</h3><p>이 화면은 판매 등록을 실행하지 않습니다. 준비 항목을 기록하고, 모든 기준이 충족된 후보만 등록 준비 상태로 표시합니다.</p></div><a className="button-link" href="/compare">후보 비교 열기</a></section>

      <section className="metrics">
        <article><span>등록 준비</span><strong>{readyRows.length}</strong><small className="metric-note">모든 기준과 수동 점검 완료</small></article>
        <article><span>검토 필요</span><strong>{reviewRows.length}</strong><small className="metric-note">일부 항목을 더 확인하세요</small></article>
        <article><span>보류</span><strong>{blockedRows.length}</strong><small className="metric-note">핵심 기준을 먼저 채우세요</small></article>
        <article><span>예상 단위 이익</span><strong>{money(estimatedGrossProfit)}</strong><small className="metric-note">등록 준비 후보 기준</small></article>
      </section>

      <div className="dashboard-grid">
        <section className="card">
          <span className="kicker">준비도 계산 기준</span><h3>내 운영 기준을 조정하세요</h3>
          <form className="commerce-controls">
            <label><span>최소 종합점수</span><input type="number" min={0} max={100} value={minScore} onChange={(event) => setMinScore(Number(event.target.value))} /></label>
            <label><span>최소 마진률 (%)</span><input type="number" min={0} max={100} value={minMargin} onChange={(event) => setMinMargin(Number(event.target.value))} /></label>
            <label className="toggle-line"><input type="checkbox" checked={requireSelection} onChange={(event) => setRequireSelection(event.target.checked)} /><span>선정 후보만 준비 완료 허용</span></label>
          </form>
          <p className="advanced-note">점수와 마진은 자동으로 계산되며, 실제 공급·재고·정책 확인은 아래 체크리스트에서 직접 저장합니다.</p>
        </section>
        <section className="card">
          <span className="kicker">지금 할 일</span><h3>준비 완료 후보</h3>
          <div className="project-candidate-list">{readyRows.slice(0, 4).map((item) => <article className="project-candidate" key={item.id}><h4>{item.name}</h4><p>{item.total_score}점 · 마진 {item.margin_rate}% · 단위 이익 {money(item.gross_profit)}</p><div className="channel-row">{item.channels.map((channel) => <span key={channel}>{channel}</span>)}</div></article>)}{readyRows.length === 0 && <div className="empty">모든 기준을 통과한 후보가 아직 없습니다. 아래 체크리스트부터 확인하세요.</div>}</div>
        </section>
      </div>

      <section className="card candidate-pool">
        <div className="section-heading"><div><span className="kicker">후보별 판매 준비</span><h3>체크하고 저장하면 준비도가 갱신됩니다</h3></div><span className="muted-copy">수동 항목 6개 + 자동 기준 5개</span></div>
        <div className="results-grid">
          {rows.map((item) => {
            const draft = drafts[item.id] ?? emptyChecklist(item.id);
            return <article className="project-candidate commerce-row" key={item.id}>
              <div className="result-top"><div><small>{item.marketplace.toUpperCase()} · {item.status}</small><h4>{item.name}</h4></div><strong>{verdictLabel(item.verdict)}</strong></div>
              <div className="readiness-bar"><span style={{ width: `${item.readiness}%` }} /></div>
              <p>준비도 {item.readiness}% · 수동 확인 {item.manualDone}/6 · 판매가 {money(item.target_price)} · 마진 {item.margin_rate}%</p>
              <div className="checklist auto-checklist">{item.checklist.filter((check) => check.source === "system").map((check) => <span className={check.passed ? "passed" : "missing"} key={check.label}>{check.passed ? "자동 통과" : "기준 미달"} · {check.label}</span>)}</div>
              <div className="manual-checklist">{manualChecklist.map((check) => <label className={draft[check.key] ? "manual-check done" : "manual-check"} key={check.key}><input type="checkbox" checked={draft[check.key]} onChange={(event) => updateDraft(item.id, { [check.key]: event.target.checked } as Partial<Checklist>)} /><span><b>{check.label}</b><small>{check.help}</small></span></label>)}</div>
              <label className="checklist-note"><span>확인 메모 (선택)</span><textarea value={draft.notes} placeholder="공급처 링크, 확인 날짜, 보류 이유를 남겨두세요." onChange={(event) => updateDraft(item.id, { notes: event.target.value })} /></label>
              <div className="card-actions"><button className="approve" disabled={savingId === item.id} onClick={() => void saveChecklist(item.id)}>{savingId === item.id ? "저장 중..." : "체크리스트 저장"}</button><div className="channel-row">{item.channels.map((channel) => <span key={channel}>{channel}</span>)}</div></div>
            </article>;
          })}
          {rows.length === 0 && <div className="empty">AI Sourcing에서 후보를 먼저 저장하세요.</div>}
        </div>
      </section>
    </AppShell>
  );
}
