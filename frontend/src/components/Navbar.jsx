import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext.jsx'
import LanguageSwitcher from './LanguageSwitcher.jsx'
import './Navbar.css'

const TABS = [
  { key: 'home', labelKey: 'nav.home', path: '/' },
  { key: 'social', labelKey: 'nav.social', path: '/social' },
  { key: 'tools', labelKey: 'nav.tools', path: '/tools' },
]

export default function Navbar({ currentTask, lastCompletedTask }) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const tabItems = useMemo(
    () =>
      TABS.map(tab => ({
        ...tab,
        label: t(tab.labelKey),
        path: tab.path,
      })),
    [t],
  )

  return (
    <header className="navbar">
      <div className="brand">
        <img src="/Logo Ver01.png" alt={t('navbar.logoAlt')} className="logo-img" />
        <div className="brand-text">
          <div className="brand-title">{t('brand.title')}</div>
        </div>
      </div>

      <nav className="tabs" role="tablist" aria-label={t('navbar.tabsAria')}>
        {tabItems.map(tab => {
          return (
            <NavLink
              key={tab.key}
              to={tab.path}
              className={({ isActive }) => (isActive ? 'tab active' : 'tab')}
              end={tab.key === 'home'}
            >
              {tab.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="nav-actions">
        <div className="current-task-display" aria-live="polite">
          <span className="current-task-label">
            {t('nav.currentTaskLabel', { defaultValue: 'Current task:' })}
          </span>
          <span className={currentTask?.title ? 'current-task-value' : 'current-task-value is-empty'}>
            {currentTask?.title ?? t('nav.currentTaskNone', { defaultValue: 'None' })}
          </span>
          {lastCompletedTask?.timeSpent && (
            <span className="current-task-last">
              {t('nav.lastTaskSummary', {
                defaultValue: 'Last: {{time}}',
                time: lastCompletedTask.timeSpent,
              })}
            </span>
          )}
        </div>
        
        {user && (
          <div className="user-menu">
            <button
              className="user-menu-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-label="User menu"
            >
              <div className="user-avatar">
                {user.profileImage ? (
                  <img src={user.profileImage} alt={user.name || user.username} />
                ) : (
                  <div className="avatar-placeholder">
                    {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="user-name">{user.name || user.username}</span>
            </button>
            
            {showUserMenu && (
              <div className="user-menu-dropdown">
                <div className="user-info">
                  <div className="user-email">{user.email}</div>
                  {user.isGuest && <div className="user-guest-badge">Guest</div>}
                </div>
                <button
                  className="logout-button"
                  onClick={() => {
                    logout()
                    setShowUserMenu(false)
                  }}
                >
                  {t('nav.logout', { defaultValue: 'Logout' })}
                </button>
              </div>
            )}
          </div>
        )}
        
        <LanguageSwitcher />
      </div>
    </header>
  )
}
