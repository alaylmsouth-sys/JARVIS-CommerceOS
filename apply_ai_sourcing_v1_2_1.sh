#!/usr/bin/env bash
set -euo pipefail
cd "${1:-.}"

python - <<'PY'
from pathlib import Path
p=Path('backend/app/modules/sourcing/router.py')
t=p.read_text()
if 'Duplicate candidate' not in t:
    t=t.replace('    score = calculate_score(payload)\n    candidate = SourcingCandidate(', '''    existing = db.scalar(\n        select(SourcingCandidate).where(\n            SourcingCandidate.name == payload.name,\n            SourcingCandidate.marketplace == payload.marketplace,\n            SourcingCandidate.country == payload.country,\n        )\n    )\n    if existing is not None:\n        raise HTTPException(status_code=409, detail="Duplicate candidate")\n\n    score = calculate_score(payload)\n    candidate = SourcingCandidate(''')
p.write_text(t)
PY

cat > frontend/app/sourcing/page.tsx <<'TSX'
"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_BASE ?? "/api/backend";

type BaseCandidate={name:string;marketplace:string;country:string;source_price:number;target_price:number;shipping_cost:number;platform_fee_rate:number;ad_cost_rate:number;competition_score:number;trend_score:number;brand_score:number;total_cost:number;gross_profit:number;margin_rate:number;total_score:number;recommendation:string;explanation:string};
type SavedCandidate=BaseCandidate&{id:number;status:"pending"|"approved"|"rejected"};

export default function SourcingPage(){
 const [token,setToken]=useState(""); const [email,setEmail]=useState("admin@jarvis.example.com"); const [password,setPassword]=useState("change-me-now");
 const [keyword,setKeyword]=useState(""); const [marketplace,setMarketplace]=useState("coupang"); const [country,setCountry]=useState("KR");
 const [results,setResults]=useState<BaseCandidate[]>([]); const [saved,setSaved]=useState<SavedCandidate[]>([]); const [tab,setTab]=useState<"search"|"saved">("search");
 const [sort,setSort]=useState<"score"|"margin"|"recent">("score"); const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
 useEffect(()=>{const t=localStorage.getItem("jarvis_token");if(t)setToken(t)},[]);
 useEffect(()=>{if(token)void loadSaved()},[token]);
 async function authFetch(path:string,init:RequestInit={}){const h=new Headers(init.headers);h.set("authorization",`Bearer ${token}`);if(init.body)h.set("content-type","application/json");return fetch(`${API}${path}`,{...init,headers:h,cache:"no-store"})}
 async function login(e:FormEvent){e.preventDefault();setBusy(true);const r=await fetch(`${API}/api/v1/auth/login`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email,password})});setBusy(false);if(!r.ok){setMessage("로그인 정보를 확인하세요.");return}const d=await r.json();localStorage.setItem("jarvis_token",d.access_token);setToken(d.access_token)}
 async function loadSaved(){const r=await authFetch("/api/v1/sourcing/candidates");if(r.status===401){localStorage.removeItem("jarvis_token");setToken("");return}if(r.ok)setSaved(await r.json())}
 async function search(e:FormEvent){e.preventDefault();setBusy(true);setMessage("");const r=await authFetch("/api/v1/sourcing/search",{method:"POST",body:JSON.stringify({keyword,marketplace,country})});setBusy(false);if(!r.ok){setMessage(`검색 실패: ${await r.text()}`);return}setResults(await r.json());setTab("search")}
 async function saveCandidate(c:BaseCandidate){setBusy(true);setMessage("");const r=await authFetch("/api/v1/sourcing/candidates",{method:"POST",body:JSON.stringify({name:c.name,marketplace:c.marketplace,country:c.country,source_price:c.source_price,target_price:c.target_price,shipping_cost:c.shipping_cost,platform_fee_rate:c.platform_fee_rate,ad_cost_rate:c.ad_cost_rate,competition_score:c.competition_score,trend_score:c.trend_score,brand_score:c.brand_score})});setBusy(false);if(r.status===409){setMessage("이미 저장된 상품 후보입니다.");return}if(!r.ok){setMessage(`저장 실패: ${await r.text()}`);return}setMessage(`${c.name} 저장 완료`);await loadSaved();setTab("saved")}
 async function changeStatus(id:number,status:"approved"|"rejected"){setBusy(true);const r=await authFetch(`/api/v1/sourcing/candidates/${id}/status`,{method:"PATCH",body:JSON.stringify({status})});setBusy(false);if(!r.ok){setMessage(`상태 변경 실패: ${await r.text()}`);return}await loadSaved()}
 const sorted=useMemo(()=>{const c=[...saved];if(sort==="score")return c.sort((a,b)=>b.total_score-a.total_score);if(sort==="margin")return c.sort((a,b)=>b.margin_rate-a.margin_rate);return c.sort((a,b)=>b.id-a.id)},[saved,sort]);
 if(!token)return <main className="login"><form onSubmit={login} className="card login-card"><h1>JARVIS</h1><p>AI Sourcing v1.2.1</p><input value={email} onChange={e=>setEmail(e.target.value)}/><input type="password" value={password} onChange={e=>setPassword(e.target.value)}/><button disabled={busy}>{busy?"확인 중...":"로그인"}</button><span>{message}</span></form></main>;
 return <main className="app"><aside><h1>JARVIS</h1><nav><b>AI Sourcing</b><span>Commerce</span><span>Trading</span><span>Telegram</span><span>Media Studio</span><span>Finance</span><span>AI Center</span><span>Settings</span></nav></aside><section className="page"><header><div><small>PRIMARY MODULE</small><h2>AI Sourcing Search</h2><p>검색 결과와 저장 목록을 분리해 관리합니다.</p></div><button className="secondary" onClick={()=>{localStorage.removeItem("jarvis_token");setToken("")}}>로그아웃</button></header>
 <form className="card search-bar" onSubmit={search}><input required placeholder="예: 휴대용 선풍기" value={keyword} onChange={e=>setKeyword(e.target.value)}/><select value={marketplace} onChange={e=>setMarketplace(e.target.value)}><option value="coupang">쿠팡</option><option value="naver">네이버</option><option value="amazon">Amazon</option><option value="shopee">Shopee</option><option value="lazada">Lazada</option></select><input value={country} onChange={e=>setCountry(e.target.value)}/><button disabled={busy}>{busy?"처리 중...":"후보 검색"}</button></form>
 <div className="tab-row"><button className={tab==="search"?"tab active":"tab"} onClick={()=>setTab("search")}>검색 결과 ({results.length})</button><button className={tab==="saved"?"tab active":"tab"} onClick={()=>setTab("saved")}>저장 목록 ({saved.length})</button></div>{message&&<p className="notice">{message}</p>}
 {tab==="saved"&&<div className="saved-toolbar"><span>저장된 후보는 새로고침 후에도 유지됩니다.</span><select value={sort} onChange={e=>setSort(e.target.value as typeof sort)}><option value="score">점수 높은 순</option><option value="margin">마진 높은 순</option><option value="recent">최근 저장 순</option></select></div>}
 <section className="results-grid">{tab==="search"&&results.map(i=><article className="card result-card" key={`${i.name}-${i.marketplace}`}><div className="result-top"><div><small>{i.marketplace.toUpperCase()} · {i.country}</small><h3>{i.name}</h3></div><div className="score">{i.total_score}</div></div><div className="stats"><span>매입가 <b>{i.source_price.toLocaleString()}</b></span><span>판매가 <b>{i.target_price.toLocaleString()}</b></span><span>순이익 <b>{i.gross_profit.toLocaleString()}</b></span><span>마진 <b>{i.margin_rate}%</b></span></div><p>{i.explanation}</p><button className="approve" disabled={busy} onClick={()=>void saveCandidate(i)}>분석 목록에 저장</button></article>)}
 {tab==="saved"&&sorted.map(i=><article className="card result-card" key={i.id}><div className="result-top"><div><small>{i.marketplace.toUpperCase()} · {i.country}</small><h3>{i.name}</h3></div><div className="score">{i.total_score}</div></div><div className="stats"><span>순이익 <b>{i.gross_profit.toLocaleString()}</b></span><span>마진 <b>{i.margin_rate}%</b></span><span>판정 <b>{i.recommendation}</b></span><span>상태 <b>{i.status}</b></span></div><p>{i.explanation}</p>{i.status==="pending"&&<div className="actions"><button className="approve" disabled={busy} onClick={()=>void changeStatus(i.id,"approved")}>승인</button><button className="reject" disabled={busy} onClick={()=>void changeStatus(i.id,"rejected")}>거절</button></div>}</article>)}
 {tab==="saved"&&sorted.length===0&&<div className="card empty">저장된 상품 후보가 없습니다.</div>}</section></section></main>
}
TSX

cat >> frontend/app/styles.css <<'CSS'
.tab-row{display:flex;gap:8px;margin-bottom:16px}.tab{background:transparent;color:#9fb0d4;border:1px solid #33476f}.tab.active{background:#203a69;color:#fff}.saved-toolbar{display:flex;justify-content:space-between;align-items:center;gap:16px;color:#9fb0d4;margin:12px 0 16px}.saved-toolbar select{width:auto}.actions{display:flex;gap:9px;margin-top:13px}.reject{background:#402128;color:#ffc0ca;border:1px solid #703340}
CSS

cat >> backend/tests/test_sourcing.py <<'PY'

def test_duplicate_candidate_is_rejected() -> None:
    with TestClient(app) as client:
        login = client.post('/api/v1/auth/login', json={'email':'admin@test.example.com','password':'test-password'})
        token = login.json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}
        payload = {'name':'Duplicate Product','marketplace':'coupang','country':'KR','source_price':10000,'target_price':25000,'shipping_cost':3000,'platform_fee_rate':12,'ad_cost_rate':5,'competition_score':50,'trend_score':70,'brand_score':65}
        first = client.post('/api/v1/sourcing/candidates', headers=headers, json=payload)
        second = client.post('/api/v1/sourcing/candidates', headers=headers, json=payload)
        assert first.status_code == 201
        assert second.status_code == 409
PY

cat >> CHANGELOG.md <<'MD'

## 1.2.1
- Added persistent saved-candidate loading
- Added search/saved tabs
- Added duplicate protection
- Added persistent approval status display
MD

docker compose up -d --build backend frontend
sleep 10
docker compose run --rm backend pytest -v
docker compose ps
