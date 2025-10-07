import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher.jsx'

const TABS = [
  { key: 'home', labelKey: 'nav.home' },
  { key: 'social', labelKey: 'nav.social' },
  { key: 'profile', labelKey: 'nav.profile' },
  { key: 'calendar', labelKey: 'nav.calendar' },
]

export default function Navbar({ activeTab = 'home', onNewTask, onChangeTab }) {
  const { t } = useTranslation()

  const tabItems = useMemo(
    () =>
      TABS.map(tab => ({
        ...tab,
        label: t(tab.labelKey),
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
          const isActive = activeTab === tab.key
          const className = isActive ? 'tab active' : 'tab'
          return (
            <button
              key={tab.key}
              className={className}
              onClick={() => onChangeTab?.(tab.key)}
              type="button"
            >
              {tab.label}
            </button>
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
