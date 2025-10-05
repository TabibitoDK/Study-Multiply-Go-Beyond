export default function RightPanel({ user, friends = [], onSelectUser }) {
  const online = friends.filter(friend => friend.status === 'online')
  const offline = friends.filter(friend => friend.status !== 'online')

  function handleSelect(id) {
    if (typeof onSelectUser === 'function') {
      onSelectUser(id)
    }
  }

  return (
    <aside className="panel">
      <button
        type="button"
        className="account panel-button"
        onClick={() => user?.id && handleSelect(user.id)}
      >
        <div
          className="avatar"
          style={user?.profileImage ? { backgroundImage: `url(${user.profileImage})` } : undefined}
        />
        <div>
          <div style={{ fontWeight: 800 }}>{user?.name ?? 'Guest'}</div>
          <div style={{ color: 'var(--subtext)', fontSize: 12 }}>@{user?.username ?? 'anonymous'}</div>
        </div>
      </button>

      <div className="hr" />

      <div className="section-title">Friends</div>
      <div className="section-title" style={{ marginTop: 6 }}>Online</div>
      {online.length === 0 && <div style={{ color: 'var(--subtext)', fontSize: 13 }}>Nobody online right now.</div>}
      {online.map(friend => (
        <button
          key={friend.id}
          type="button"
          className="friend panel-button"
          onClick={() => handleSelect(friend.id)}
        >
          <div className="friend-main">
            <div
              className="friend-avatar"
              style={friend.profileImage ? { backgroundImage: `url(${friend.profileImage})` } : undefined}
            />
            <span>{friend.name}</span>
          </div>
          <span className="badge">{friend.activity ?? 'Online'}</span>
        </button>
      ))}

      <div className="section-title" style={{ marginTop: 12 }}>Offline</div>
      {offline.length === 0 && <div style={{ color: 'var(--subtext)', fontSize: 13 }}>No offline friends.</div>}
      {offline.map(friend => (
        <button
          key={friend.id}
          type="button"
          className="friend panel-button"
          onClick={() => handleSelect(friend.id)}
        >
          <div className="friend-main">
            <div
              className="friend-avatar"
              style={friend.profileImage ? { backgroundImage: `url(${friend.profileImage})` } : undefined}
            />
            <span>{friend.name}</span>
          </div>
          <span className="badge">Offline</span>
        </button>
      ))}
    </aside>
  )
}
