"use client";

import type { ReactNode } from "react";

type ModuleKey = "sourcing" | "projects" | "trading" | "telegram" | "media" | "finance";

type AppShellProps = {
  active: ModuleKey;
  kicker: string;
  title: string;
  description: string;
  onLogout: () => void;
  children: ReactNode;
};

const modules: { key: ModuleKey; label: string; href?: string }[] = [
  { key: "sourcing", label: "AI Sourcing", href: "/sourcing" },
  { key: "projects", label: "Projects", href: "/projects" },
  { key: "trading", label: "Trading" },
  { key: "telegram", label: "Telegram" },
  { key: "media", label: "Media" },
  { key: "finance", label: "Finance" },
];

export function AppShell({ active, kicker, title, description, onLogout, children }: AppShellProps) {
  return (
    <main className="app">
      <aside>
        <a className="brand" href="/sourcing">JARVIS</a>
        <nav>
          {modules.map((item) => {
            if (!item.href) {
              return (
                <span key={item.key}>
                  {item.label}
                  <small>planned</small>
                </span>
              );
            }
            return item.key === active ? (
              <b key={item.key}>{item.label}</b>
            ) : (
              <a href={item.href} key={item.key}>
                {item.label}
              </a>
            );
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
          <button className="secondary" onClick={onLogout}>
            Log out
          </button>
        </header>
        {children}
      </section>
    </main>
  );
}
