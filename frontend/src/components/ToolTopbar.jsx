import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { getToolCopy } from '../lib/tools.js'
import LanguageSwitcher from './LanguageSwitcher.jsx'

export default function ToolTopbar({ toolId }) {
  const { t } = useTranslation()
  const { title } = getToolCopy(t, toolId)

  return (
    <header className="calendar-navbar">
      <div className="calendar-navbar-content">
        <Link to="/tools" className="calendar-navbar-back">
          {t('calendar.nav.back', { defaultValue: 'Back to Tools' })}
        </Link>
        <img
          src="/Logo Ver01.png"
          alt={`${title} logo`}
          className="calendar-navbar-logo"
        />
        <div className="calendar-navbar-text">
          <h1>{title}</h1>
          <p>{t('calendar.appSubtitle', { defaultValue: 'Nyacademy' })}</p>
        </div>
      </div>
      <div className="calendar-navbar-actions" aria-hidden="false">
        <LanguageSwitcher />
      </div>
    </header>
  )
}
