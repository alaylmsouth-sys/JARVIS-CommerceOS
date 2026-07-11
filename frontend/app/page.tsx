const modules = [
  ["AI Sourcing", "상품 후보, 점수, 승인"],
  ["Commerce", "상품·주문·재고"],
  ["Trading", "향후 연결"],
  ["Telegram", "향후 연결"],
  ["Media Studio", "향후 연결"],
  ["Finance", "향후 연결"],
  ["AI Center", "AI 직원 상태"],
  ["Settings", "API·NAS·보안"],
];

export default function Home() {
  return (
    <main className="shell">
      <aside className="sidebar">
        <h1>JARVIS</h1>
        <p>CommerceOS v0.1</p>
        <nav>
          {modules.map(([name]) => (
            <button key={name} className={name === "AI Sourcing" ? "active" : ""}>
              {name}
            </button>
          ))}
        </nav>
      </aside>

      <section className="content">
        <header>
          <div>
            <span className="eyebrow">PRIMARY MODULE</span>
            <h2>AI Sourcing Center</h2>
            <p>한국, 미국, 동남아 상품 후보를 한곳에서 검토합니다.</p>
          </div>
          <button className="primary">새 소싱 분석</button>
        </header>

        <div className="metrics">
          <article><span>후보 상품</span><strong>0</strong></article>
          <article><span>승인 대기</span><strong>0</strong></article>
          <article><span>평균 점수</span><strong>0</strong></article>
          <article><span>예상 마진</span><strong>0%</strong></article>
        </div>

        <section className="panel">
          <h3>AI 추천 상품</h3>
          <p>백엔드 API와 연결되면 추천 상품이 이곳에 나타납니다.</p>
          <div className="empty">첫 상품 후보를 등록해 보세요.</div>
        </section>
      </section>
    </main>
  );
}
