import { Plus } from 'lucide-react'

export default function Navbar({ activeTab = 'Home', onNewTask }) {
  return (
    <header className="navbar">
      <div className="brand">
        <div className="logo">Logo</div>
        <div>
          <div style={{ fontWeight: 800 }}>Website name</div>
        </div>
      </div>

      <nav className="tabs" role="tablist" aria-label="Pages">
        {['Home','Record','Profile','Calendar'].map(t => (
          <button key={t} className={`tab ${activeTab===t?'active':''}`}>{t}</button>
        ))}
      </nav>

      <div className="nav-actions">
        <button className="btn" onClick={onNewTask}>
          <Plus size={18} style={{ marginRight: 6 }} /> New Task
        </button>
      </div>
    </header>
  )
}
