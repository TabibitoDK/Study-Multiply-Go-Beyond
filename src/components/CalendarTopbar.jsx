import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export default function CalendarTopbar() {
  const { t } = useTranslation()

  return (
    <header className="calendar-navbar">
      <div className="calendar-navbar-content">
        <Link to="/tools" className="calendar-navbar-back">
          {t('calendar.nav.back', { defaultValue: 'Back to Tools' })}
        </Link>
        <img
          src="/Logo Ver01.png"
          alt="Calendar logo"
          className="calendar-navbar-logo"
        />
        <div className="calendar-navbar-text">
          <h1>{t('calendar.appTitle', { defaultValue: 'Calendar' })}</h1>
          <p>{t('calendar.appSubtitle', { defaultValue: 'Nyacademy' })}</p>
        </div>
      </div>
    </header>
  )
}
