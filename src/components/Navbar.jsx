import { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher.jsx'

const TABS = [
  { key: 'home', labelKey: 'nav.home', path: '/' },
  { key: 'social', labelKey: 'nav.social', path: '/social' },
  { key: 'library', labelKey: 'nav.library', path: '/library' },
  { key: 'tools', labelKey: 'nav.tools', path: '/tools' },
]

export default function Navbar({ onNewTask }) {
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
        <LanguageSwitcher />
        <button className="btn" onClick={onNewTask} type="button">
          {t('nav.newTask')}
        </button>
      </div>
    </header>
  )
}
