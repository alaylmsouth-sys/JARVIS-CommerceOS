"use client";

import type { ReactNode } from "react";

type ModuleKey = "dashboard" | "sourcing" | "compare" | "projects" | "ai-center" | "commerce" | "trading" | "media" | "finance" | "settings";

type AppShellProps = {
  active: ModuleKey;
  kicker: string;
  title: string;
  description: string;
  onLogout: () => void;
  children: ReactNode;
};

const modules: { key: ModuleKey; label: string; hint: string; href?: string; status?: string }[] = [
  { key: "dashboard", label: "한눈에 보기", hint: "오늘 할 일", href: "/dashboard" },
  { key: "sourcing", label: "상품 후보 찾기", hint: "1단계", href: "/sourcing" },
  { key: "compare", label: "후보 비교", hint: "결정하기", href: "/compare" },
  { key: "projects", label: "프로젝트 관리", hint: "2단계", href: "/projects" },
  { key: "finance", label: "수익성 점검", hint: "3단계", href: "/finance" },
  { key: "commerce", label: "판매 준비", hint: "4단계", href: "/commerce" },
  { key: "media", label: "콘텐츠 만들기", hint: "5단계", href: "/media" },
  { key: "ai-center", label: "AI 도우미", hint: "도움 받기", href: "/ai-center" },
  { key: "trading", label: "Trading", hint: "준비 중", status: "planned" },
  { key: "settings", label: "Settings", hint: "준비 중", status: "planned" },
];

export function AppShell({ active, kicker, title, description, onLogout, children }: AppShellProps) {
  return (
    <main className="app">
      <aside>
        <a className="brand" href="/dashboard" aria-label="JARVIS CommerceOS 홈">
          <span className="brand-mark">J</span>
          <span>JARVIS <small>Commerce OS</small></span>
        </a>
        <div className="workspace-chip"><b>운영 워크스페이스</b>상품 후보를 찾고, 수익성을 확인한 뒤 판매 준비까지 한 흐름으로 관리합니다.</div>
        <nav aria-label="주요 메뉴">
          <div className="nav-label">업무 흐름</div>
          {modules.map((item) => {
            if (item.href) {
              return item.key === active ? (
                <b key={item.key}><span>{item.label}</span><small>{item.hint}</small></b>
              ) : (
                <a href={item.href} key={item.key}><span>{item.label}</span><small>{item.hint}</small></a>
              );
            }
            return <span key={item.key}><span>{item.label}</span><small>{item.status}</small></span>;
          })}
        </nav>
        <div className="sidebar-footer"><b>안전한 운영 원칙</b>외부 등록·가격·재고 변경은 사용자의 명시적 승인 전에는 실행되지 않습니다.</div>
      </aside>

      <section className="page">
        <header className="page-header">
          <div className="header-copy">
            <small>{kicker}</small>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div className="header-actions">
            <a className="secondary button-link" href="/dashboard">한눈에 보기</a>
            <button className="secondary" onClick={onLogout}>로그아웃</button>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}
