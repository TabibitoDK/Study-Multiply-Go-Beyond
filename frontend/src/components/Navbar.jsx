import { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher.jsx'

const TABS = [
  { key: 'home', labelKey: 'nav.home', path: '/' },
  { key: 'social', labelKey: 'nav.social', path: '/social' },
  { key: 'tools', labelKey: 'nav.tools', path: '/tools' },
]

export default function Navbar({ currentTask, lastCompletedTask }) {
  const { t } = useTranslation()

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
        <LanguageSwitcher />
      </div>
    </header>
  )
}
