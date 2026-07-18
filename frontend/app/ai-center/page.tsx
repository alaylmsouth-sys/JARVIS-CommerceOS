"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api/backend";

type Staff = { id: string; name: string; role: string; domain: string; focus: string[]; opening: string };
type Message = { speaker: "user" | "staff"; staffName?: string; text: string };

const roadmap = ["기반 안정화", "AI Sourcing 고도화", "Projects 실사용화", "Commerce 운영 모듈", "Media, Finance, Trading 확장", "운영 전환"];

export default function AICenterPage() {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState("");
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("operations");
  const [context, setContext] = useState("staging passed, Alembic enabled");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [actions, setActions] = useState<string[]>([]);

  useEffect(() => { setToken(localStorage.getItem("jarvis_token") ?? ""); setReady(true); }, []);
  useEffect(() => { if (token) void loadStaff(); }, [token]);

  const selectedStaff = useMemo(() => staff.find((item) => item.id === selectedStaffId) ?? staff[0], [staff, selectedStaffId]);

  function clearSession() { localStorage.removeItem("jarvis_token"); setToken(""); }

  async function authFetch(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    headers.set("authorization", `Bearer ${token}`);
    if (init.body) headers.set("content-type", "application/json");
    const response = await fetch(`${API}${path}`, { ...init, headers, cache: "no-store" });
    if (response.status === 401) clearSession();
    return response;
  }

  async function loadStaff() {
    const response = await authFetch("/api/v1/ai-center/staff");
    if (!response.ok) { setStatus("AI 직원 목록을 불러오지 못했습니다."); return; }
    const data: Staff[] = await response.json();
    setStaff(data);
    if (data.length > 0 && !data.some((item) => item.id === selectedStaffId)) setSelectedStaffId(data[0].id);
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    if (!message.trim()) return;
    const outgoing = message.trim();
    setMessage("");
    setMessages((items) => [...items, { speaker: "user", text: outgoing }]);
    setBusy(true); setStatus("");
    const response = await authFetch("/api/v1/ai-center/chat", { method: "POST", body: JSON.stringify({ staff_id: selectedStaffId, message: outgoing, context }) });
    setBusy(false);
    if (!response.ok) { setStatus(`상담 실패: ${await response.text()}`); return; }
    const body: { staff_name: string; reply: string; recommended_actions: string[] } = await response.json();
    setMessages((items) => [...items, { speaker: "staff", staffName: body.staff_name, text: body.reply }]);
    setActions(body.recommended_actions);
  }

  if (!ready) return null;
  if (!token) return <main className="login"><div className="card login-card"><h1>JARVIS</h1><p>AI Center를 사용하려면 먼저 로그인하세요.</p><a className="button-link" href="/sourcing">로그인 화면으로 이동</a></div></main>;

  return <AppShell active="ai-center" kicker="OPERATING SYSTEM" title="AI Center" description="분야별 AI 직원과 상의하면서 6단계 운영 청사진을 실행합니다." onLogout={clearSession}>
    <div className="workspace cockpit-workspace">
      <div className="card">
        <h3>AI 직원</h3>
        <div className="project-list">
          {staff.map((item) => <button key={item.id} className={selectedStaffId === item.id ? "project-item active" : "project-item"} onClick={() => setSelectedStaffId(item.id)}><strong>{item.name}</strong><span>{item.domain}</span></button>)}
        </div>
      </div>

      <div className="card cockpit-chat">
        <h3>{selectedStaff ? `${selectedStaff.name} · ${selectedStaff.role}` : "상담"}</h3>
        {selectedStaff && <p>{selectedStaff.opening}</p>}
        {selectedStaff && <div className="stats">{selectedStaff.focus.map((item) => <span key={item}>{item}</span>)}</div>}
        <div className="project-candidate-list chat-log">
          {messages.length === 0 && <div className="empty">질문을 보내면 AI 직원의 답변이 여기에 쌓입니다.</div>}
          {messages.map((item, index) => <article className="project-candidate" key={`${item.speaker}-${index}`}><h4>{item.speaker === "user" ? "나" : item.staffName}</h4><p className="pre-wrap">{item.text}</p></article>)}
        </div>
        <form onSubmit={sendMessage} className="project-form chat-form">
          <textarea placeholder="예: 운영 전환 전에 어떤 순서로 가야 해?" rows={4} value={message} onChange={(event) => setMessage(event.target.value)} />
          <input placeholder="현재 맥락" value={context} onChange={(event) => setContext(event.target.value)} />
          <button disabled={busy}>{busy ? "상담 중..." : "상의하기"}</button>
        </form>
        {status && <p className="notice">{status}</p>}
      </div>

      <div className="card">
        <h3>추천 행동</h3>
        <div className="project-candidate-list">
          {(actions.length ? actions : ["AI 직원을 선택하고 지금 막힌 일을 질문하세요.", "답변에서 바로 실행할 1개 행동만 고르세요.", "실행 결과를 다시 AI Center에 넣어 다음 결정을 받으세요."]).map((item) => <article className="project-candidate" key={item}><p>{item}</p></article>)}
        </div>
        <h3 className="section-gap">6단계 청사진</h3>
        <div className="project-list">
          {roadmap.map((item, index) => <div className="project-item" key={item}><strong>{index + 1}. {item}</strong><span>{index < 2 ? "active" : "planned"}</span></div>)}
        </div>
      </div>
    </div>
  </AppShell>;
}
