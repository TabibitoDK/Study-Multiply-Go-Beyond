import { useTranslation } from 'react-i18next'

export default function RightPanel({ friends = [], groups = [], onOpenChat, isCollapsed, onToggleCollapse }) {
  const { t } = useTranslation()

  const online = friends.filter(friend => friend.status === 'online')
  const offline = friends.filter(friend => friend.status !== 'online')

  function handleChatOpen(id, type = 'friend') {
    if (typeof onOpenChat === 'function') {
      onOpenChat(id, type)
    }
  }

  if (isCollapsed) {
    return (
      <>
        <div className="panel panel-collapsed">
          <button
            type="button"
            className="panel-toggle-btn"
            onClick={() => onToggleCollapse(false)}
            title="Show sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="panel panel-collapsed">
        <button
          type="button"
          className="panel-toggle-btn"
          onClick={() => onToggleCollapse(true)}
          title="Hide sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
      <aside className="panel" style={{ height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexShrink: 0 }}>
          <div className="section-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
            {t('rightPanel.friends')}
          </div>
        </div>

      <div className="hr" style={{ flexShrink: 0 }} />

      {/* Friends Section - 60% */}
      <div style={{ flex: '6 1 0', overflow: 'auto', marginBottom: 16, minHeight: 0 }}>
        <div className="section-title" style={{ marginTop: 6 }}>{t('rightPanel.online')}</div>
        {online.length === 0 && (
          <div style={{ color: 'var(--subtext)', fontSize: 13 }}>{t('rightPanel.nobodyOnline')}</div>
        )}
        {online.map(friend => (
          <button
            key={friend.id}
            type="button"
            className="friend panel-button"
            onClick={() => handleChatOpen(friend.id, 'friend')}
          >
            <div className="friend-main">
              <div
                className="friend-avatar"
                style={friend.profileImage ? { backgroundImage: `url(${friend.profileImage})` } : undefined}
              />
              <span>{friend.name}</span>
            </div>
            <span className="badge">{friend.activity ?? t('rightPanel.badgeOnline')}</span>
          </button>
        ))}

        <div className="section-title" style={{ marginTop: 12 }}>{t('rightPanel.offline')}</div>
        {offline.length === 0 && (
          <div style={{ color: 'var(--subtext)', fontSize: 13 }}>{t('rightPanel.nobodyOffline')}</div>
        )}
        {offline.map(friend => (
          <button
            key={friend.id}
            type="button"
            className="friend panel-button"
            onClick={() => handleChatOpen(friend.id, 'friend')}
          >
            <div className="friend-main">
              <div
                className="friend-avatar"
                style={friend.profileImage ? { backgroundImage: `url(${friend.profileImage})` } : undefined}
              />
              <span>{friend.name}</span>
            </div>
            <span className="badge">{t('rightPanel.badgeOffline')}</span>
          </button>
        ))}
      </div>

      <div className="hr" style={{ flexShrink: 0 }} />

      {/* Groups Section - 40% */}
      <div style={{ flex: '4 1 0', overflow: 'auto', minHeight: 0 }}>
        <div className="section-title" style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
          Groups
        </div>
        {groups.length === 0 && (
          <div style={{ color: 'var(--subtext)', fontSize: 13 }}>No groups yet</div>
        )}
        {groups.map(group => (
          <button
            key={group.id}
            type="button"
            className="friend panel-button"
            onClick={() => handleChatOpen(group.id, 'group')}
          >
            <div className="friend-main">
              <div
                className="friend-avatar"
                style={group.image ? { backgroundImage: `url(${group.image})` } : { background: 'var(--accent)' }}
              />
              <span>{group.name}</span>
            </div>
            <span className="badge" style={{ fontSize: 11 }}>{group.memberCount} members</span>
          </button>
        ))}
      </div>
      </aside>
    </>
  )
}
