import { useTranslation } from 'react-i18next'

export default function RightPanel({ user, friends = [], onSelectUser }) {
  const { t } = useTranslation()
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
          <div style={{ fontWeight: 800 }}>{user?.name ?? t('rightPanel.guest')}</div>
          <div style={{ color: 'var(--subtext)', fontSize: 12 }}>@{user?.username ?? t('rightPanel.anonymous')}</div>
        </div>
      </button>

      <div className="hr" />

      <div className="section-title">{t('rightPanel.friends')}</div>
      <div className="section-title" style={{ marginTop: 6 }}>{t('rightPanel.online')}</div>
      {online.length === 0 && (
        <div style={{ color: 'var(--subtext)', fontSize: 13 }}>{t('rightPanel.nobodyOnline')}</div>
      )}
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
          onClick={() => handleSelect(friend.id)}
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
    </aside>
  )
}
