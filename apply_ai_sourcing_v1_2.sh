#!/usr/bin/env bash
set -euo pipefail
cd "${1:-.}"

cat > backend/app/modules/sourcing/search.py <<'PY'
from hashlib import sha256
from app.modules.sourcing.schemas import CandidateCreate
from app.modules.sourcing.scoring import calculate_score

CATALOG = {
    "선풍기": [
        ("휴대용 미니 선풍기", 8500, 21900, 2800, 44, 78, 66),
        ("접이식 탁상용 선풍기", 12500, 32900, 3200, 52, 74, 72),
        ("넥밴드 선풍기", 16800, 39900, 3500, 61, 69, 70),
        ("캠핑용 충전식 선풍기", 22000, 54900, 4500, 48, 82, 77),
    ],
    "텀블러": [
        ("진공 보온 텀블러", 9000, 24900, 3000, 58, 64, 75),
        ("대용량 손잡이 텀블러", 13500, 32900, 3500, 51, 72, 81),
        ("차량용 슬림 텀블러", 11000, 28900, 3000, 45, 67, 70),
    ],
    "블렌더": [
        ("휴대용 미니 블렌더", 14500, 39900, 3500, 55, 76, 82),
        ("무선 쉐이크 블렌더", 17800, 46900, 3800, 49, 73, 80),
        ("USB 충전 믹서컵", 9800, 28900, 3000, 42, 69, 68),
    ],
}

SUFFIXES = ["프리미엄", "휴대용", "대용량", "슬림형", "무선형"]

def stable(keyword: str, index: int, low: int, high: int) -> int:
    value = int(sha256(f"{keyword}:{index}".encode()).hexdigest()[:8], 16)
    return low + value % (high - low + 1)

def search_candidates(keyword: str, marketplace: str, country: str) -> list[dict]:
    normalized = keyword.strip().lower()
    rows = next((items for key, items in CATALOG.items() if key in normalized), None)
    if rows is None:
        rows = []
        for i, suffix in enumerate(SUFFIXES):
            source = stable(normalized, i, 7000, 22000)
            target = int(source * stable(normalized, i + 10, 180, 260) / 100)
            rows.append((
                f"{suffix} {keyword}", source, target,
                stable(normalized, i + 20, 2500, 4500),
                stable(normalized, i + 30, 35, 75),
                stable(normalized, i + 40, 45, 85),
                stable(normalized, i + 50, 45, 85),
            ))

    results = []
    for name, source, target, shipping, competition, trend, brand in rows:
        payload = CandidateCreate(
            name=name, marketplace=marketplace, country=country,
            source_price=source, target_price=target, shipping_cost=shipping,
            platform_fee_rate=12, ad_cost_rate=5,
            competition_score=competition, trend_score=trend, brand_score=brand,
        )
        score = calculate_score(payload)
        results.append({**payload.model_dump(), **score.__dict__})
    return sorted(results, key=lambda x: x["total_score"], reverse=True)
PY

cat > backend/app/modules/sourcing/search_schemas.py <<'PY'
from typing import Literal
from pydantic import BaseModel, Field

Marketplace = Literal["coupang", "naver", "amazon", "shopee", "lazada"]

class SearchRequest(BaseModel):
    keyword: str = Field(min_length=2, max_length=100)
    marketplace: Marketplace = "coupang"
    country: str = Field(default="KR", min_length=2, max_length=10)

class SearchCandidate(BaseModel):
    name: str
    marketplace: str
    country: str
    source_price: float
    target_price: float
    shipping_cost: float
    platform_fee_rate: float
    ad_cost_rate: float
    competition_score: float
    trend_score: float
    brand_score: float
    total_cost: float
    gross_profit: float
    margin_rate: float
    total_score: float
    recommendation: str
    explanation: str
PY

python - <<'PY'
from pathlib import Path
p = Path('backend/app/modules/sourcing/router.py')
t = p.read_text(encoding='utf-8')
if 'SearchRequest' not in t:
    t = t.replace(
        'from app.modules.sourcing.scoring import calculate_score',
        'from app.modules.sourcing.scoring import calculate_score\nfrom app.modules.sourcing.search import search_candidates\nfrom app.modules.sourcing.search_schemas import SearchCandidate, SearchRequest'
    )
    t += '''\n\n@router.post("/search", response_model=list[SearchCandidate])\ndef search(payload: SearchRequest, _: User = Depends(get_current_user)) -> list[dict]:\n    return search_candidates(payload.keyword, payload.marketplace, payload.country)\n'''
p.write_text(t, encoding='utf-8')
PY

cat > frontend/app/sourcing/page.tsx <<'TSX'
"use client";
import { FormEvent, useEffect, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api/backend";

type Candidate = {
  name:string; marketplace:string; country:string;
  source_price:number; target_price:number; shipping_cost:number;
  platform_fee_rate:number; ad_cost_rate:number;
  competition_score:number; trend_score:number; brand_score:number;
  total_cost:number; gross_profit:number; margin_rate:number;
  total_score:number; recommendation:string; explanation:string;
};

export default function SourcingPage(){
  const [token,setToken]=useState("");
  const [email,setEmail]=useState("admin@jarvis.example.com");
  const [password,setPassword]=useState("change-me-now");
  const [keyword,setKeyword]=useState("");
  const [marketplace,setMarketplace]=useState("coupang");
  const [country,setCountry]=useState("KR");
  const [results,setResults]=useState<Candidate[]>([]);
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);

  useEffect(()=>{ const saved=localStorage.getItem("jarvis_token"); if(saved) setToken(saved); },[]);

  async function login(e:FormEvent){
    e.preventDefault(); setBusy(true); setMessage("");
    try{
      const r=await fetch(`${API}/api/v1/auth/login`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email,password})});
      if(!r.ok){setMessage("로그인 정보를 확인하세요.");return;}
      const d=await r.json(); localStorage.setItem("jarvis_token",d.access_token); setToken(d.access_token);
    }finally{setBusy(false)}
  }

  async function search(e:FormEvent){
    e.preventDefault(); setBusy(true); setMessage("");
    try{
      const r=await fetch(`${API}/api/v1/sourcing/search`,{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${token}`},body:JSON.stringify({keyword,marketplace,country})});
      if(!r.ok){setMessage(`검색 실패: ${await r.text()}`);return;}
      setResults(await r.json());
    }finally{setBusy(false)}
  }

  async function save(item:Candidate){
    setBusy(true); setMessage("");
    try{
      const r=await fetch(`${API}/api/v1/sourcing/candidates`,{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${token}`},body:JSON.stringify({
        name:item.name,marketplace:item.marketplace,country:item.country,
        source_price:item.source_price,target_price:item.target_price,shipping_cost:item.shipping_cost,
        platform_fee_rate:item.platform_fee_rate,ad_cost_rate:item.ad_cost_rate,
        competition_score:item.competition_score,trend_score:item.trend_score,brand_score:item.brand_score
      })});
      setMessage(r.ok?`${item.name} 저장 완료`:`저장 실패: ${await r.text()}`);
    }finally{setBusy(false)}
  }

  if(!token) return <main className="login"><form className="card login-card" onSubmit={login}><h1>JARVIS</h1><p>AI Sourcing v1.2</p><input value={email} onChange={e=>setEmail(e.target.value)}/><input type="password" value={password} onChange={e=>setPassword(e.target.value)}/><button disabled={busy}>{busy?"확인 중...":"로그인"}</button><span>{message}</span></form></main>;

  return <main className="app"><aside><h1>JARVIS</h1><nav><b>AI Sourcing</b><span>Commerce</span><span>Trading</span><span>Telegram</span><span>Media Studio</span><span>Finance</span><span>AI Center</span><span>Settings</span></nav></aside><section className="page"><header><div><small>PRIMARY MODULE</small><h2>AI Sourcing Search</h2><p>무료 샘플 카탈로그와 규칙 엔진으로 후보를 생성합니다.</p></div><button className="secondary" onClick={()=>{localStorage.removeItem("jarvis_token");setToken("")}}>로그아웃</button></header>
  <form className="card search-bar" onSubmit={search}><input required placeholder="예: 휴대용 선풍기, 텀블러, 블렌더" value={keyword} onChange={e=>setKeyword(e.target.value)}/><select value={marketplace} onChange={e=>setMarketplace(e.target.value)}><option value="coupang">쿠팡</option><option value="naver">네이버</option><option value="amazon">Amazon</option><option value="shopee">Shopee</option><option value="lazada">Lazada</option></select><input value={country} onChange={e=>setCountry(e.target.value)}/><button disabled={busy}>{busy?"검색 중...":"후보 검색"}</button></form>
  {message&&<p className="notice">{message}</p>}
  <section className="results-grid">{results.map(item=><article className="card result-card" key={`${item.name}-${item.marketplace}`}><div className="result-top"><div><small>{item.marketplace.toUpperCase()} · {item.country}</small><h3>{item.name}</h3></div><div className="score">{item.total_score}</div></div><div className="stats"><span>매입가 <b>{item.source_price.toLocaleString()}</b></span><span>판매가 <b>{item.target_price.toLocaleString()}</b></span><span>순이익 <b>{item.gross_profit.toLocaleString()}</b></span><span>마진 <b>{item.margin_rate}%</b></span></div><p>{item.explanation}</p><button className="approve" disabled={busy} onClick={()=>void save(item)}>분석 목록에 저장</button></article>)}</section>
  </section></main>;
}
TSX

cat >> frontend/app/styles.css <<'CSS'
.search-bar{display:grid;grid-template-columns:minmax(260px,1fr) 150px 90px 130px;gap:10px;margin:26px 0}
.results-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px}
.result-card h3{margin:6px 0 0}.result-top{display:flex;justify-content:space-between;gap:12px}
.stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:18px 0}
.stats span{color:#91a2c8}.stats b{display:block;color:white;margin-top:4px}.notice{color:#a9efd3}
@media(max-width:900px){.search-bar{grid-template-columns:1fr}}
CSS

cat >> CHANGELOG.md <<'MD'

## 1.2.0
- Added free keyword candidate search
- Added deterministic sample candidate generation
- Added profit, margin and score preview
- Added save-to-analysis workflow
MD

docker compose up -d --build backend frontend
sleep 10
docker compose ps
echo "AI Sourcing v1.2 applied."
