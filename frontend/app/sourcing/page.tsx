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
