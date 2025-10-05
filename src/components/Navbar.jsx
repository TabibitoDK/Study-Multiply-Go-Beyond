// ...
export default function Navbar({ activeTab='Home', onNewTask, onChangeTab }) {
  const TABS = ['Home','Social','Profile','Calendar'];   // <— changed
  return (
    <header className="navbar">
      <div className="brand">
        <img src="/Logo Ver01.png" alt="Study Multiply Go Beyond logo" className="logo-img" />
        <div className="brand-text">
          <div className="brand-title">Study Multiply Go Beyond</div>
        </div>
      </div>

      <nav className="tabs" role="tablist" aria-label="Pages">
        {TABS.map(t => (
          <button
            key={t}
            className={`tab ${activeTab===t?'active':''}`}
            onClick={() => onChangeTab?.(t)}
          >
            {t}
          </button>
        ))}
      </nav>

      <div className="nav-actions">
        <button className="btn" onClick={onNewTask}>New Task</button>
      </div>
    </header>
  );
}
