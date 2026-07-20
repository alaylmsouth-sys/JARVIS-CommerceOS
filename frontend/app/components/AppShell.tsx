"use client";

import type { ReactNode } from "react";

type ModuleKey = "dashboard" | "sourcing" | "projects" | "ai-center" | "commerce" | "trading" | "media" | "finance" | "settings";

type AppShellProps = {
  active: ModuleKey;
  kicker: string;
  title: string;
  description: string;
  onLogout: () => void;
  children: ReactNode;
};

const modules: { key: ModuleKey; label: string; href?: string; status?: string }[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard" },
  { key: "sourcing", label: "AI Sourcing", href: "/sourcing" },
  { key: "projects", label: "Projects", href: "/projects" },
  { key: "finance", label: "Finance", href: "/finance" },
  { key: "commerce", label: "Commerce", href: "/commerce" },
  { key: "ai-center", label: "AI Center", href: "/ai-center" },
  { key: "media", label: "Media Studio", status: "planned" },
  { key: "trading", label: "Trading", status: "planned" },
  { key: "settings", label: "Settings", status: "planned" },
];

export function AppShell({ active, kicker, title, description, onLogout, children }: AppShellProps) {
  return (
    <main className="app">
      <aside>
        <a className="brand" href="/dashboard">JARVIS</a>
        <nav>
          {modules.map((item) => {
            if (item.href) {
              return item.key === active ? (
                <b key={item.key}>{item.label}</b>
              ) : (
                <a href={item.href} key={item.key}>{item.label}</a>
              );
            }
            return <span key={item.key}>{item.label}<small>{item.status}</small></span>;
          })}
        </nav>
      </aside>

      <section className="page">
        <header>
          <div>
            <small>{kicker}</small>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <div className="header-actions">
            <a className="secondary button-link" href="/dashboard">조종석</a>
            <button className="secondary" onClick={onLogout}>로그아웃</button>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}
