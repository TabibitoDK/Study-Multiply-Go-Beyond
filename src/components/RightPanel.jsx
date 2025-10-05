export default function RightPanel({ user, friends }) {
  const online = friends.filter(f => f.status==='online')
  const offline = friends.filter(f => f.status!=='online')

  return (
    <aside className="panel">
      <div className="account">
        <div className="avatar" />
        <div>
          <div style={{ fontWeight: 800 }}>{user.nickname}</div>
          <div style={{ color: 'var(--subtext)', fontSize: 12 }}>{user.username}</div>
        </div>
      </div>

      <div className="hr" />

      <div className="section-title">Friends</div>
      <div className="section-title" style={{ marginTop: 6 }}>Online</div>
      {online.length === 0 && <div style={{ color:'var(--subtext)', fontSize: 13 }}>—</div>}
      {online.map(f => (
        <div key={f.id} className="friend">
          <span>{f.name}</span><span className="badge">{f.activity ?? 'Idle'}</span>
        </div>
      ))}

      <div className="section-title" style={{ marginTop: 12 }}>Offline</div>
      {offline.length === 0 && <div style={{ color:'var(--subtext)', fontSize: 13 }}>—</div>}
      {offline.map(f => (
        <div key={f.id} className="friend">
          <span>{f.name}</span><span className="badge">Offline</span>
        </div>
      ))}
    </aside>
  )
}
