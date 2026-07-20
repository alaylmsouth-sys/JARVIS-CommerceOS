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

type MediaAsset = Candidate & {
  angle: string;
  brief: string;
  hooks: string[];
  launchCopy: string;
  contentScore: number;
  statusLabel: "ready" | "draft" | "hold";
};

function money(value: number) {
  return Math.round(value).toLocaleString("ko-KR");
}

function compactName(name: string) {
  return name.replace(/\s+/g, " ").trim();
}

function pickAngle(candidate: Candidate, tone: string) {
  if (candidate.margin_rate >= 35) return `${tone} 수익성과 합리적 가격을 함께 보여주는 비교형 메시지`;
  if (candidate.total_score >= 70) return `${tone} 구매 이유를 빠르게 납득시키는 베스트셀러형 메시지`;
  return `${tone} 문제 상황과 사용 장면을 먼저 보여주는 발견형 메시지`;
}

function buildHooks(candidate: Candidate, tone: string) {
  const name = compactName(candidate.name);
  return [
    `${name}, 왜 지금 테스트할 만할까요?`,
    `${tone} 고객에게 ${name}을 보여줄 첫 3초`,
    `마진 ${candidate.margin_rate}% 후보를 콘텐츠로 검증하는 방법`,
  ];
}

export default function MediaPage() {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [tone, setTone] = useState("실용적인");
  const [channel, setChannel] = useState("상세페이지");
  const [minScore, setMinScore] = useState(60);
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
      setMessage("콘텐츠 후보 데이터를 불러오지 못했습니다.");
      return;
    }
    setCandidates(await response.json());
  }

  const assets = useMemo<MediaAsset[]>(() => {
    return candidates
      .map((candidate) => {
        const selected = ["selected", "linked", "approved"].includes(candidate.status);
        const contentScore = Math.round(candidate.total_score * 0.65 + candidate.margin_rate * 0.35 + (selected ? 8 : 0));
        const statusLabel: MediaAsset["statusLabel"] = contentScore >= 72 ? "ready" : contentScore >= minScore ? "draft" : "hold";
        const name = compactName(candidate.name);
        const brief = `${channel}용 ${name} 콘텐츠입니다. 핵심 가격은 ${money(candidate.target_price)}원, 예상 마진은 ${candidate.margin_rate}%이며, 첫 테스트에서는 문제 상황, 사용 장면, 가격 근거를 순서대로 보여줍니다.`;
        const launchCopy = `${name}을 ${candidate.marketplace.toUpperCase()} 기준으로 먼저 검증합니다. ${tone} 톤으로 사용 장면을 보여주고, 판매가 ${money(candidate.target_price)}원과 마진 ${candidate.margin_rate}%의 근거를 짧게 설명합니다.`;
        return {
          ...candidate,
          angle: pickAngle(candidate, tone),
          brief,
          hooks: buildHooks(candidate, tone),
          launchCopy,
          contentScore,
          statusLabel,
        };
      })
      .sort((a, b) => b.contentScore - a.contentScore);
  }, [candidates, channel, minScore, tone]);

  const readyAssets = assets.filter((item) => item.statusLabel === "ready");
  const draftAssets = assets.filter((item) => item.statusLabel === "draft");
  const holdAssets = assets.filter((item) => item.statusLabel === "hold");
  const selectedAsset = assets[0];

  if (!ready) return null;

  if (!token) {
    return (
      <main className="login">
        <div className="card login-card">
          <h1>JARVIS</h1>
          <p>Media Studio를 사용하려면 먼저 로그인하세요.</p>
          <a className="button-link" href="/sourcing">로그인 화면으로 이동</a>
        </div>
      </main>
    );
  }

  return (
    <AppShell active="media" kicker="MEDIA STUDIO" title="Media Studio" description="커머스 준비 후보를 콘텐츠 훅, 상품 브리프, 런칭 카피로 정리합니다." onLogout={clearSession}>
      {message && <p className="notice">{message}</p>}

      <section className="metrics">
        <article><span>콘텐츠 준비</span><strong>{readyAssets.length}</strong></article>
        <article><span>초안 후보</span><strong>{draftAssets.length}</strong></article>
        <article><span>보류</span><strong>{holdAssets.length}</strong></article>
        <article><span>전체 후보</span><strong>{assets.length}</strong></article>
      </section>

      <div className="dashboard-grid">
        <section className="card">
          <h3>콘텐츠 기준</h3>
          <form className="media-controls">
            <label>
              <span>톤</span>
              <select value={tone} onChange={(event) => setTone(event.target.value)}>
                <option value="실용적인">실용적인</option>
                <option value="프리미엄">프리미엄</option>
                <option value="가성비 중심의">가성비 중심의</option>
              </select>
            </label>
            <label>
              <span>채널</span>
              <select value={channel} onChange={(event) => setChannel(event.target.value)}>
                <option value="상세페이지">상세페이지</option>
                <option value="숏폼 영상">숏폼 영상</option>
                <option value="검색 광고">검색 광고</option>
              </select>
            </label>
            <label>
              <span>최소 콘텐츠 점수</span>
              <input type="number" min={0} max={100} value={minScore} onChange={(event) => setMinScore(Number(event.target.value))} />
            </label>
          </form>
          <div className="project-candidate-list">
            <article className="project-candidate"><h4>게시 승인 게이트</h4><p>이 화면은 카피 초안만 만듭니다. 광고 집행, 외부 게시, 마켓 등록은 사용자 승인 전 실행하지 않습니다.</p></article>
            <article className="project-candidate"><h4>다음 연결</h4><p>준비된 브리프는 실제 마켓 어댑터와 모델 기반 AI Center가 붙기 전까지 내부 검토 자료로만 사용합니다.</p></article>
          </div>
        </section>

        <section className="card">
          <h3>대표 브리프</h3>
          {selectedAsset ? (
            <article className="project-candidate media-feature">
              <small>{selectedAsset.marketplace.toUpperCase()} · 콘텐츠 점수 {selectedAsset.contentScore}</small>
              <h4>{selectedAsset.name}</h4>
              <p>{selectedAsset.brief}</p>
              <strong>{selectedAsset.angle}</strong>
            </article>
          ) : <div className="empty">AI Sourcing에서 후보를 저장하세요.</div>}
        </section>
      </div>

      <section className="card candidate-pool">
        <h3>콘텐츠 초안</h3>
        <div className="results-grid">
          {assets.map((item) => (
            <article className="project-candidate media-row" key={item.id}>
              <div className="result-top">
                <div><small>{item.marketplace.toUpperCase()} · {item.status}</small><h4>{item.name}</h4></div>
                <strong>{item.statusLabel === "ready" ? "준비" : item.statusLabel === "draft" ? "초안" : "보류"}</strong>
              </div>
              <div className="readiness-bar"><span style={{ width: `${Math.min(item.contentScore, 100)}%` }} /></div>
              <p>{item.launchCopy}</p>
              <div className="media-hooks">
                {item.hooks.map((hook) => <span key={hook}>{hook}</span>)}
              </div>
              <div className="stats">
                <span>콘텐츠 점수 <b>{item.contentScore}</b></span>
                <span>마진률 <b>{item.margin_rate}%</b></span>
                <span>판매가 <b>{money(item.target_price)}</b></span>
                <span>단위 이익 <b>{money(item.gross_profit)}</b></span>
              </div>
              {item.tags && <p>태그: {item.tags}</p>}
            </article>
          ))}
          {assets.length === 0 && <div className="empty">AI Sourcing에서 후보를 먼저 저장하세요.</div>}
        </div>
      </section>
    </AppShell>
  );
}
