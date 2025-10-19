import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useI18nFormats } from '../lib/i18n-format.js'
const STORAGE_KEY = 'smgb-calendar-events-v1'

export default function CalendarPage() {
  const navigate = useNavigate()
  const today = new Date()
  const { t } = useTranslation()
  const { locale, formatDate } = useI18nFormats()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [events, setEvents] = useState(() => {
    if (typeof window === 'undefined') return {}
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)
  const [draftText, setDraftText] = useState('')
  const [quickText, setQuickText] = useState('')

  const weekdayLabels = useMemo(() => {
    const reference = new Date(Date.UTC(2021, 5, 6))
    const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' })
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(reference)
      date.setUTCDate(reference.getUTCDate() + index)
      return formatter.format(date)
    })
  }, [locale])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
    } catch {}
  }, [events])

  useEffect(() => {
    if (!modalOpen) return
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        closeModal()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [modalOpen])

  const monthLabel = useMemo(() => {
    const monthDate = new Date(currentYear, currentMonth, 1)
    return formatDate(monthDate, { month: 'long' })
  }, [currentMonth, currentYear, formatDate])
  const daysInMonth = useMemo(
    () => new Date(currentYear, currentMonth + 1, 0).getDate(),
    [currentMonth, currentYear]
  )
  const firstDay = useMemo(
    () => new Date(currentYear, currentMonth, 1).getDay(),
    [currentMonth, currentYear]
  )

  const gridCells = useMemo(() => {
    const blanks = Array.from({ length: firstDay }, () => null)
    const days = Array.from({ length: daysInMonth }, (_, idx) => idx + 1)
    return [...blanks, ...days]
  }, [firstDay, daysInMonth])

  useEffect(() => {
    setSelectedDay(prev => {
      if (prev && prev <= daysInMonth) {
        return prev
      }
      if (
        today.getFullYear() === currentYear &&
        today.getMonth() === currentMonth
      ) {
        return today.getDate()
      }
      return null
    })
  }, [currentMonth, currentYear, daysInMonth])

  const selectedDayKey = useMemo(
    () => (selectedDay ? keyForDay(selectedDay) : null),
    [selectedDay, currentMonth, currentYear]
  )

  useEffect(() => {
    setQuickText('')
  }, [selectedDayKey])

  const selectedDateLabel = useMemo(() => {
    if (!selectedDay) return ''
    const selectedDate = new Date(currentYear, currentMonth, selectedDay)
    return formatDate(selectedDate, { dateStyle: 'long' })
  }, [selectedDay, currentMonth, currentYear, formatDate])

  const selectedEvents = useMemo(() => {
    if (!selectedDayKey) return []
    return Array.isArray(events[selectedDayKey]) ? events[selectedDayKey] : []
  }, [selectedDayKey, events])

  const totalEventsThisMonth = useMemo(() => {
    return Object.entries(events).reduce((count, [key, list]) => {
      if (!Array.isArray(list) || list.length === 0) return count
      const [year, month] = key.split('-').map(Number)
      if (year === currentYear && month === currentMonth + 1) {
        return count + list.length
      }
      return count
    }, 0)
  }, [events, currentMonth, currentYear])

  const eventsNextSevenDays = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)

    return Object.entries(events).reduce((count, [key, list]) => {
      if (!Array.isArray(list) || list.length === 0) return count
      const [year, month, day] = key.split('-').map(Number)
      const date = new Date(year, month - 1, day)
      if (date >= start && date <= end) {
        return count + list.length
      }
      return count
    }, 0)
  }, [events])

  const upcomingEvents = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)

    const items = []
    Object.entries(events).forEach(([key, list]) => {
      if (!Array.isArray(list) || list.length === 0) return
      const [year, month, day] = key.split('-').map(Number)
      const date = new Date(year, month - 1, day)
      list.forEach((text, index) => {
        items.push({
          id: `${key}-${index}`,
          date,
          text,
          day,
          monthIndex: month - 1,
          year,
          dayKey: key,
          eventIndex: index
        })
      })
    })

    items.sort((a, b) => a.date - b.date)

    return items
      .filter(item => item.date >= start)
      .slice(0, 8)
      .map(item => ({
        ...item,
        label: formatDate(item.date, { weekday: 'short', month: 'short', day: 'numeric' })
      }))
  }, [events, formatDate])

  function changeMonth(offset) {
    setCurrentMonth(prevMonth => {
      let nextMonth = prevMonth + offset
      if (nextMonth < 0) {
        setCurrentYear(prevYear => prevYear - 1)
        nextMonth = 11
      } else if (nextMonth > 11) {
        setCurrentYear(prevYear => prevYear + 1)
        nextMonth = 0
      }
      return nextMonth
    })
  }

  function handlePrev() {
    changeMonth(-1)
  }

  function handleNext() {
    changeMonth(1)
  }

  function handleReset() {
    const now = new Date()
    setCurrentMonth(now.getMonth())
    setCurrentYear(now.getFullYear())
  }

  function handleBack() {
    navigate('/tools')
  }

  function keyForDay(day) {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  function selectDay(day) {
    if (!day) return
    setSelectedDay(day)
  }

  function openModalForDay(day) {
    selectDay(day)
    setDraftText('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setDraftText('')
  }

  function handleSaveEvent(event) {
    event.preventDefault()
    if (!selectedDayKey) return
    const text = draftText.trim()
    if (!text) return
    setEvents(prev => {
      const next = { ...prev }
      const existing = Array.isArray(next[selectedDayKey]) ? next[selectedDayKey] : []
      next[selectedDayKey] = [...existing, text]
      return next
    })
    setDraftText('')
    setModalOpen(false)
  }

  function handleQuickAdd(event) {
    event.preventDefault()
    if (!selectedDayKey) return
    const text = quickText.trim()
    if (!text) return
    setEvents(prev => {
      const next = { ...prev }
      const existing = Array.isArray(next[selectedDayKey]) ? next[selectedDayKey] : []
      next[selectedDayKey] = [...existing, text]
      return next
    })
    setQuickText('')
  }

  function handleRemoveEvent(index, dayKey) {
    const key = dayKey ?? selectedDayKey
    if (!key) return
    setEvents(prev => {
      const existing = Array.isArray(prev[key]) ? [...prev[key]] : []
      if (index < 0 || index >= existing.length) return prev
      existing.splice(index, 1)
      const next = { ...prev }
      if (existing.length === 0) {
        delete next[key]
      } else {
        next[key] = existing
      }
      return next
    })
  }

  function handleAddEventClick() {
    if (!selectedDay) {
      const now = new Date()
      setCurrentMonth(now.getMonth())
      setCurrentYear(now.getFullYear())
      setSelectedDay(now.getDate())
    }
    setDraftText('')
    setModalOpen(true)
  }

  function jumpToDay(year, monthIndex, day) {
    setCurrentYear(year)
    setCurrentMonth(monthIndex)
    setSelectedDay(day)
  }

  function handleDayKeyDown(event, day) {
    if (!day) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      selectDay(day)
      if (event.shiftKey) {
        setDraftText('')
        setModalOpen(true)
      }
    }
  }

  function isToday(day) {
    return (
      day &&
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    )
  }

  return (
    <div className="calendar-page">
      <div className="calendar-breadcrumb">
        <button
          type="button"
          className="calendar-back-btn"
          onClick={handleBack}
        >
          <ArrowLeft size={18} aria-hidden="true" />
          <span>{t('calendar.actions.backToTools', { defaultValue: 'Back to tools' })}</span>
        </button>
      </div>

      <div className="calendar-insights">
        <div className="calendar-insight-card">
          <span>{t('calendar.stats.focusDay', { defaultValue: 'Focused day' })}</span>
          <strong>{selectedDateLabel || t('calendar.stats.pickDay', { defaultValue: 'Select a day' })}</strong>
          <p>
            {t('calendar.stats.eventsPlanned', {
              defaultValue: '{{count}} events planned',
              count: selectedEvents.length
            })}
          </p>
        </div>
        <div className="calendar-insight-card">
          <span>{t('calendar.stats.month', { defaultValue: 'This month' })}</span>
          <strong>{totalEventsThisMonth}</strong>
          <p>{t('calendar.stats.monthHint', { defaultValue: 'Scheduled items across this month' })}</p>
        </div>
        <div className="calendar-insight-card">
          <span>{t('calendar.stats.nextSeven', { defaultValue: 'Next 7 days' })}</span>
          <strong>{eventsNextSevenDays}</strong>
          <p>{t('calendar.stats.nextSevenHint', { defaultValue: 'Upcoming reminders this week' })}</p>
        </div>
      </div>

      <div className="calendar-body">
        <div className="calendar-surface">
          <div className="calendar-header">
            <div className="calendar-header-main">
              <div className="calendar-nav">
                <button className="calendar-nav-btn" onClick={handlePrev} aria-label={t('calendar.aria.previous')}>
                  <ChevronLeft size={18} />
                </button>
                <button className="calendar-nav-btn" onClick={handleNext} aria-label={t('calendar.aria.next')}>
                  <ChevronRight size={18} />
                </button>
              </div>
              <div className="calendar-title">
                <h2>{t('calendar.title', { month: monthLabel, year: currentYear })}</h2>
                <p>{t('calendar.subtitle')}</p>
              </div>
            </div>
            <div className="calendar-actions">
              <button className="btn ghost calendar-today-btn" onClick={handleReset}>
                {t('buttons.today')}
              </button>
              <button className="btn calendar-add-btn" type="button" onClick={handleAddEventClick}>
                <Plus size={16} />
                {t('calendar.actions.addEvent', { defaultValue: 'Add event' })}
              </button>
            </div>
          </div>

          <div className="calendar-weekdays">
            {weekdayLabels.map(label => (
              <div key={label} className="calendar-weekday">
                {label}
              </div>
            ))}
          </div>

          <div className="calendar-grid">
            {gridCells.map((day, index) => {
              const dateKey = day ? keyForDay(day) : null
              const dayEvents = day && dateKey ? events[dateKey] ?? [] : []
              const visibleEvents = dayEvents.slice(0, 3)
              const hiddenCount = dayEvents.length - visibleEvents.length
              const classes = [
                'calendar-cell',
                !day && 'is-placeholder',
                dayEvents.length > 0 && 'has-events',
                isToday(day) && 'is-today',
                selectedDay === day && 'is-selected'
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <div
                  key={`${index}-${day ?? 'empty'}`}
                  className={classes}
                  role={day ? 'button' : undefined}
                  tabIndex={day ? 0 : -1}
                  onClick={() => day && selectDay(day)}
                  onDoubleClick={() => day && openModalForDay(day)}
                  onKeyDown={event => handleDayKeyDown(event, day)}
                >
                  {day && (
                    <>
                      <div className="calendar-date">
                        <span>{day}</span>
                        {dayEvents.length > 0 && <span className="calendar-dot" />}
                      </div>
                      <div className="calendar-events">
                        {visibleEvents.map((eventText, eventIndex) => (
                          <span key={eventIndex} className="calendar-event">
                            {eventText}
                          </span>
                        ))}
                        {hiddenCount > 0 && (
                          <span className="calendar-event calendar-event-more">
                            {t('calendar.moreEvents', { count: hiddenCount })}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <aside className="calendar-sidebar">
          <div className="calendar-sidebar-section">
            <div className="calendar-sidebar-header">
              <div>
                <h3>{selectedDateLabel || t('calendar.sidebar.noSelection', { defaultValue: 'Pick a day' })}</h3>
                <p>
                  {selectedEvents.length > 0
                    ? t('calendar.sidebar.eventsCount', {
                        defaultValue: '{{count}} notes scheduled',
                        count: selectedEvents.length
                      })
                    : t('calendar.sidebar.empty', { defaultValue: 'No notes yet – add something meaningful.' })}
                </p>
              </div>
              <button type="button" className="btn ghost calendar-add-btn small" onClick={handleAddEventClick}>
                <Plus size={16} />
                {t('calendar.actions.add', { defaultValue: 'New' })}
              </button>
            </div>

            <form className="calendar-quick-form" onSubmit={handleQuickAdd}>
              <input
                className="calendar-quick-input"
                placeholder={
                  selectedDayKey
                    ? t('calendar.sidebar.quickPlaceholder', { defaultValue: 'Add a quick reminder…' })
                    : t('calendar.sidebar.quickPlaceholderDisabled', { defaultValue: 'Select a day to add a reminder' })
                }
                value={quickText}
                onChange={event => setQuickText(event.target.value)}
                disabled={!selectedDayKey}
              />
              <button
                type="submit"
                className="calendar-quick-submit"
                disabled={!selectedDayKey || !quickText.trim()}
              >
                {t('calendar.sidebar.quickAdd', { defaultValue: 'Add' })}
              </button>
            </form>

            <ul className="calendar-selected-events">
              {selectedEvents.map((text, index) => (
                <li key={`${selectedDayKey}-${index}`}>
                  <span>{text}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEvent(index)}
                    aria-label={t('calendar.sidebar.removeEvent', { defaultValue: 'Remove event' })}
                  >
                    &times;
                  </button>
                </li>
              ))}
              {selectedEvents.length === 0 && (
                <li className="calendar-selected-empty">
                  {t('calendar.sidebar.noEvents', { defaultValue: 'Nothing scheduled for this day yet.' })}
                </li>
              )}
            </ul>
          </div>

          <div className="calendar-sidebar-section">
            <div className="calendar-sidebar-header">
              <h3>{t('calendar.sidebar.upcomingTitle', { defaultValue: 'Upcoming' })}</h3>
            </div>
            <ul className="calendar-upcoming-list">
              {upcomingEvents.length === 0 && (
                <li className="calendar-upcoming-empty">
                  {t('calendar.sidebar.upcomingEmpty', { defaultValue: 'No upcoming items yet. Add one above!' })}
                </li>
              )}
              {upcomingEvents.map(item => (
                <li key={item.id} className="calendar-upcoming-item">
                  <button
                    type="button"
                    className="calendar-upcoming-main"
                    onClick={() => jumpToDay(item.year, item.monthIndex, item.day)}
                  >
                    <span className="calendar-upcoming-date">{item.label}</span>
                    <span className="calendar-upcoming-text">{item.text}</span>
                  </button>
                  <button
                    type="button"
                    className="calendar-upcoming-remove"
                    onClick={() => handleRemoveEvent(item.eventIndex, item.dayKey)}
                    aria-label={t('calendar.sidebar.removeEvent', { defaultValue: 'Remove event' })}
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal calendar-modal" onClick={event => event.stopPropagation()}>
            <h2 className="modal-title">{t('calendar.modal.title')}</h2>
            <p className="calendar-modal-subtitle">{selectedDateLabel}</p>

            {selectedEvents.length > 0 && (
              <div className="calendar-modal-existing">
                <span className="calendar-modal-section">{t('calendar.modal.existing')}</span>
                <ul>
                  {selectedEvents.map((text, index) => (
                    <li key={index}>{text}</li>
                  ))}
                </ul>
              </div>
            )}

            <form className="calendar-modal-form" onSubmit={handleSaveEvent}>
              <textarea
                className="input calendar-modal-textarea"
                rows={4}
                placeholder={t('calendar.modal.placeholder')}
                value={draftText}
                onChange={event => setDraftText(event.target.value)}
              />
              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={closeModal}>
                  {t('buttons.cancel')}
                </button>
                <button type="submit" className="btn">
                  {t('calendar.modal.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
