import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight } from 'lucide-react'

export default function RightPanel({ friends = [], groups = [], onOpenChat, isCollapsed, onToggleCollapse }) {
  const { t } = useTranslation()
  const [expandedSection, setExpandedSection] = useState('friends') // 'friends' or 'groups'

  const online = friends.filter(friend => friend.status === 'online')
  const offline = friends.filter(friend => friend.status !== 'online')

  function handleChatOpen(id, type = 'friend') {
    if (typeof onOpenChat === 'function') {
      onOpenChat(id, type)
    }
  }

  function toggleSection(section) {
    setExpandedSection(expandedSection === section ? null : section)
  }

  function renderFriendCard(friend) {
    const isOnline = friend.status === 'online'
    // Remove the duplicate count display - only show activity/status text
    const chipText = isOnline
      ? friend.activity ?? t('rightPanel.badgeOnline')
      : t('rightPanel.badgeOffline')

    return (
      <button
        key={friend.id}
        type="button"
        className={`friend-card panel-button ${isOnline ? 'friend-card--online' : 'friend-card--offline'}`}
        onClick={() => handleChatOpen(friend.id, 'friend')}
      >
        <div
          className="friend-card__avatar"
          style={friend.profileImage ? { backgroundImage: `url(${friend.profileImage})` } : undefined}
        >
          <span className={`friend-card__status-dot ${isOnline ? 'friend-card__status-dot--online' : 'friend-card__status-dot--offline'}`} />
        </div>
        <div className="friend-card__body">
          <div className="friend-card__top">
            <span className="friend-card__name">{friend.name}</span>
            <span className="friend-card__chip">{chipText}</span>
          </div>
          <span className="friend-card__status">
            {isOnline ? t('rightPanel.online') : t('rightPanel.offline')}
          </span>
        </div>
        <svg
          className="friend-card__chevron"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    )
  }

  function renderGroupCard(group) {
    const initials = typeof group.name === 'string'
      ? group.name
        .split(' ')
        .map(part => part[0])
        .filter(Boolean)
        .join('')
        .slice(0, 2)
        .toUpperCase()
      : ''

    return (
      <button
        key={group.id}
        type="button"
        className="group-card panel-button"
        onClick={() => handleChatOpen(group.id, 'group')}
      >
        <div
          className="group-card__avatar"
          style={group.image ? { backgroundImage: `url(${group.image})` } : undefined}
        >
          {!group.image && <span className="group-card__initials">{initials || '?'}</span>}
        </div>
        <div className="group-card__body">
          <span className="group-card__name">{group.name}</span>
          <span className="group-card__meta">
            {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>
        <svg
          className="group-card__chevron"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    )
  }

  function renderSectionHeader(title, count, sectionKey) {
    const isExpanded = expandedSection === sectionKey
    const ChevronIcon = isExpanded ? ChevronDown : ChevronRight

    return (
      <button
        type="button"
        className="friends-panel__section-header friends-panel__section-header--clickable"
        onClick={() => toggleSection(sectionKey)}
        aria-expanded={isExpanded}
        aria-controls={`${sectionKey}-section-content`}
      >
        <div className="friends-panel__section-title-container">
          <ChevronIcon 
            size={16} 
            className="friends-panel__section-chevron"
          />
          <span className="friends-panel__section-title">{title}</span>
        </div>
        {count > 0 && <span className="friends-panel__section-count">{count}</span>}
      </button>
    )
  }

  if (isCollapsed) {
    return (
      <aside className="panel panel-collapsed-view friends-panel-collapsed">
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
      </aside>
    )
  }

  const isFriendsExpanded = expandedSection === 'friends'
  const isGroupsExpanded = expandedSection === 'groups'

  return (
    <aside className="panel friends-panel">
      <header className="friends-panel__header">
        <div className="friends-panel__title">
          {t('rightPanel.friends')}
        </div>
        <button
          type="button"
          className="panel-toggle-btn friends-panel__toggle-btn"
          onClick={() => onToggleCollapse(true)}
          title="Hide sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </header>

      {/* Collapsible Friends and Groups Container */}
      <div className="friends-panel__collapsible-container">
        {/* Friends Section */}
        <section className="friends-panel__section friends-panel__section--primary">
          {renderSectionHeader(t('rightPanel.friends'), friends.length, 'friends')}
          
          <div 
            id="friends-section-content"
            className={`friends-panel__collapsible-content ${isFriendsExpanded ? 'friends-panel__collapsible-content--expanded' : 'friends-panel__collapsible-content--collapsed'}`}
            aria-hidden={!isFriendsExpanded}
          >
            <div className="friends-panel__subsection">
              <div className="friends-panel__subsection-heading">
                <span className="friends-panel__subsection-title">{t('rightPanel.online')}</span>
                {online.length > 0 && <span className="friends-panel__subsection-count">{online.length}</span>}
              </div>

              {online.length === 0 ? (
                <p className="friends-panel__empty">{t('rightPanel.nobodyOnline')}</p>
              ) : (
                <div className="friends-panel__list friends-panel__list--scrollable">
                  {online.map(renderFriendCard)}
                </div>
              )}
            </div>

            <div className="friends-panel__subsection">
              <div className="friends-panel__subsection-heading">
                <span className="friends-panel__subsection-title">{t('rightPanel.offline')}</span>
                {offline.length > 0 && <span className="friends-panel__subsection-count">{offline.length}</span>}
              </div>

              {offline.length === 0 ? (
                <p className="friends-panel__empty">{t('rightPanel.nobodyOffline')}</p>
              ) : (
                <div className="friends-panel__list friends-panel__list--scrollable">
                  {offline.map(renderFriendCard)}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Groups Section */}
        <section className="friends-panel__section friends-panel__section--groups">
          {renderSectionHeader(t('rightPanel.groups'), groups.length, 'groups')}
          
          <div 
            id="groups-section-content"
            className={`friends-panel__collapsible-content ${isGroupsExpanded ? 'friends-panel__collapsible-content--expanded' : 'friends-panel__collapsible-content--collapsed'}`}
            aria-hidden={!isGroupsExpanded}
          >
            {groups.length === 0 ? (
              <p className="friends-panel__empty">{t('rightPanel.noGroupsYet')}</p>
            ) : (
              <div className="friends-panel__list">
                {groups.map(renderGroupCard)}
              </div>
            )}
          </div>
        </section>
      </div>
    </aside>
  )
}
