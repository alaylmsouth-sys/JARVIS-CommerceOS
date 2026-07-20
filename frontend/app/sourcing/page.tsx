"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { AppShell } from "../components/AppShell";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api/backend";

type CandidateStatus = "pending" | "approved" | "rejected";

type BaseCandidate = {
  name: string;
  marketplace: string;
  country: string;
  source_price: number;
  target_price: number;
  shipping_cost: number;
  platform_fee_rate: number;
  ad_cost_rate: number;
  competition_score: number;
  trend_score: number;
  brand_score: number;
  total_cost: number;
  gross_profit: number;
  margin_rate: number;
  total_score: number;
  recommendation: string;
  explanation: string;
};

type SavedCandidate = BaseCandidate & {
  id: number;
  status: CandidateStatus;
};

const statusLabel: Record<CandidateStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

function candidateInput(candidate: BaseCandidate) {
  return {
    name: candidate.name,
    marketplace: candidate.marketplace,
    country: candidate.country,
    source_price: candidate.source_price,
    target_price: candidate.target_price,
    shipping_cost: candidate.shipping_cost,
    platform_fee_rate: candidate.platform_fee_rate,
    ad_cost_rate: candidate.ad_cost_rate,
    competition_score: candidate.competition_score,
    trend_score: candidate.trend_score,
    brand_score: candidate.brand_score,
  };
}

export default function SourcingPage() {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("admin@jarvis.example.com");
  const [password, setPassword] = useState("change-me-now");
  const [keyword, setKeyword] = useState("");
  const [marketplace, setMarketplace] = useState("coupang");
  const [country, setCountry] = useState("KR");
  const [results, setResults] = useState<BaseCandidate[]>([]);
  const [saved, setSaved] = useState<SavedCandidate[]>([]);
  const [tab, setTab] = useState<"search" | "saved">("search");
  const [sort, setSort] = useState<"score" | "margin" | "recent">("score");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setToken(localStorage.getItem("jarvis_token") ?? "");
    setReady(true);
  }, []);

  useEffect(() => {
    if (token) void loadSaved();
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

  async function login(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const response = await fetch(`${API}/api/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setBusy(false);

    if (!response.ok) {
      setMessage("Check the admin email and password.");
      return;
    }

    const data = await response.json();
    localStorage.setItem("jarvis_token", data.access_token);
    setToken(data.access_token);
  }

  async function loadSaved() {
    const response = await authFetch("/api/v1/sourcing/candidates");
    if (response.ok) setSaved(await response.json());
  }

  async function search(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const response = await authFetch("/api/v1/sourcing/search", {
      method: "POST",
      body: JSON.stringify({ keyword, marketplace, country }),
    });
    setBusy(false);

    if (!response.ok) {
      setMessage(`Search failed: ${await response.text()}`);
      return;
    }

    setResults(await response.json());
    setTab("search");
  }

  async function saveCandidate(candidate: BaseCandidate) {
    setBusy(true);
    setMessage("");
    const response = await authFetch("/api/v1/sourcing/candidates", {
      method: "POST",
      body: JSON.stringify(candidateInput(candidate)),
    });
    setBusy(false);

    if (response.status === 409) {
      setMessage("This candidate is already saved.");
      await loadSaved();
      setTab("saved");
      return;
    }
    if (!response.ok) {
      setMessage(`Save failed: ${await response.text()}`);
      return;
    }

    setMessage(`${candidate.name} saved.`);
    await loadSaved();
    setTab("saved");
  }

  async function changeStatus(id: number, status: "approved" | "rejected") {
    setBusy(true);
    setMessage("");
    const response = await authFetch(`/api/v1/sourcing/candidates/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    setBusy(false);

    if (!response.ok) {
      setMessage(`Status update failed: ${await response.text()}`);
      return;
    }

    await loadSaved();
  }

  const sorted = useMemo(() => {
    const candidates = [...saved];
    if (sort === "score") return candidates.sort((a, b) => b.total_score - a.total_score);
    if (sort === "margin") return candidates.sort((a, b) => b.margin_rate - a.margin_rate);
    return candidates.sort((a, b) => b.id - a.id);
  }, [saved, sort]);

  if (!ready) return null;

  if (!token) {
    return (
      <main className="login">
        <form onSubmit={login} className="card login-card">
          <h1>JARVIS</h1>
          <p>AI Sourcing MVP</p>
          <input value={email} onChange={(event) => setEmail(event.target.value)} aria-label="Email" />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-label="Password"
          />
          <button disabled={busy}>{busy ? "Checking..." : "Log in"}</button>
          {message && <span>{message}</span>}
        </form>
      </main>
    );
  }

  return (
    <AppShell
      active="sourcing"
      kicker="AI SOURCING"
      title="Candidate Search"
      description="Search, score, save, and approve product candidates."
      onLogout={clearSession}
    >
      <form className="card search-bar" onSubmit={search}>
        <input
          required
          placeholder="Product keyword"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <select value={marketplace} onChange={(event) => setMarketplace(event.target.value)}>
          <option value="coupang">Coupang</option>
          <option value="naver">Naver</option>
          <option value="amazon">Amazon</option>
          <option value="shopee">Shopee</option>
          <option value="lazada">Lazada</option>
        </select>
        <input value={country} onChange={(event) => setCountry(event.target.value)} aria-label="Country" />
        <button disabled={busy}>{busy ? "Working..." : "Search"}</button>
      </form>

      <div className="tab-row">
        <button className={tab === "search" ? "tab active" : "tab"} onClick={() => setTab("search")}>
          Search Results ({results.length})
        </button>
        <button className={tab === "saved" ? "tab active" : "tab"} onClick={() => setTab("saved")}>
          Saved List ({saved.length})
        </button>
      </div>

      {message && <p className="notice">{message}</p>}

      {tab === "saved" && (
        <div className="saved-toolbar">
          <span>Saved candidates persist after refresh.</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
            <option value="score">Top score</option>
            <option value="margin">Top margin</option>
            <option value="recent">Recent</option>
          </select>
        </div>
      )}

      <section className="results-grid">
        {tab === "search" &&
          results.map((candidate) => (
            <article className="card result-card" key={`${candidate.name}-${candidate.marketplace}`}>
              <div className="result-top">
                <div>
                  <small>
                    {candidate.marketplace.toUpperCase()} / {candidate.country}
                  </small>
                  <h3>{candidate.name}</h3>
                </div>
                <div className="score">{candidate.total_score}</div>
              </div>
              <div className="stats">
                <span>
                  Source <b>{candidate.source_price.toLocaleString()}</b>
                </span>
                <span>
                  Target <b>{candidate.target_price.toLocaleString()}</b>
                </span>
                <span>
                  Profit <b>{candidate.gross_profit.toLocaleString()}</b>
                </span>
                <span>
                  Margin <b>{candidate.margin_rate}%</b>
                </span>
              </div>
              <p>{candidate.explanation}</p>
              <button className="approve" disabled={busy} onClick={() => void saveCandidate(candidate)}>
                Save Candidate
              </button>
            </article>
          ))}

        {tab === "saved" &&
          sorted.map((candidate) => (
            <article className="card result-card" key={candidate.id}>
              <div className="result-top">
                <div>
                  <small>
                    {candidate.marketplace.toUpperCase()} / {candidate.country}
                  </small>
                  <h3>{candidate.name}</h3>
                </div>
                <div className="score">{candidate.total_score}</div>
              </div>
              <div className="stats">
                <span>
                  Profit <b>{candidate.gross_profit.toLocaleString()}</b>
                </span>
                <span>
                  Margin <b>{candidate.margin_rate}%</b>
                </span>
                <span>
                  Rating <b>{candidate.recommendation}</b>
                </span>
                <span>
                  Status <b>{statusLabel[candidate.status] ?? candidate.status}</b>
                </span>
              </div>
              <p>{candidate.explanation}</p>
              {candidate.status === "pending" && (
                <div className="actions">
                  <button className="approve" disabled={busy} onClick={() => void changeStatus(candidate.id, "approved")}>
                    Approve
                  </button>
                  <button className="reject" disabled={busy} onClick={() => void changeStatus(candidate.id, "rejected")}>
                    Reject
                  </button>
                </div>
              )}
            </article>
          ))}

        {tab === "saved" && sorted.length === 0 && <div className="card empty">No saved candidates yet.</div>}
      </section>
    </AppShell>
  );
}
