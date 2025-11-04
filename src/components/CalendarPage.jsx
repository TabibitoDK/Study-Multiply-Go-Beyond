import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import dayjs from 'dayjs'
import { useTaskManager } from '../context/TaskManagerContext.jsx'
import { useI18nFormats } from '../lib/i18n-format.js'
const STORAGE_KEY = 'smgb-calendar-events-v1'

export default function CalendarPage() {
  const today = new Date()
  const { t } = useTranslation()
  const { plans, addTask } = useTaskManager()
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
  const [quickText, setQuickText] = useState('')
  const [modalDate, setModalDate] = useState(null)
  const [modalPlanId, setModalPlanId] = useState('')
  const [modalTaskName, setModalTaskName] = useState('')
  const [modalTaskDescription, setModalTaskDescription] = useState('')
  const [modalCreatedAt, setModalCreatedAt] = useState(() => dayjs().toISOString())
  const [modalStartAt, setModalStartAt] = useState(() => dayjs().format('YYYY-MM-DDTHH:mm'))

  const modalCreatedDisplay = useMemo(() => {
    const created = modalCreatedAt ? dayjs(modalCreatedAt) : null
    return created?.isValid() ? created.format('MMMM D, YYYY h:mm A') : ''
  }, [modalCreatedAt])

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
    setModalPlanId(prev => {
      if (!Array.isArray(plans) || plans.length === 0) {
        return ''
      }
      if (prev && plans.some(plan => plan.id === prev)) {
        return prev
      }
      return plans[0].id
    })
  }, [plans])

  const hasPlans = Array.isArray(plans) && plans.length > 0

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

  const modalDateKey = useMemo(() => {
    if (!modalDate) return null
    return `${modalDate.getFullYear()}-${String(modalDate.getMonth() + 1).padStart(2, '0')}-${String(modalDate.getDate()).padStart(2, '0')}`
  }, [modalDate])

  const modalDateLabel = useMemo(() => {
    if (!modalDate) return ''
    const fallback = formatDate(modalDate, { dateStyle: 'long' })
    if (!modalStartAt) return fallback
    const parsed = dayjs(modalStartAt)
    return parsed.isValid() ? parsed.format('dddd, MMMM D, YYYY h:mm A') : fallback
  }, [modalDate, modalStartAt, formatDate])

  const modalEvents = useMemo(() => {
    if (!modalDateKey) return []
    return Array.isArray(events[modalDateKey]) ? events[modalDateKey] : []
  }, [modalDateKey, events])

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

  const todaysDate = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const todayKey = useMemo(() => {
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  }, [])

  const selectedDayTasks = useMemo(() => {
    if (!selectedDayKey) return []
    return Array.isArray(events[selectedDayKey]) ? events[selectedDayKey] : []
  }, [events, selectedDayKey])

  const todaysTasks = useMemo(() => {
    return Array.isArray(events[todayKey]) ? events[todayKey] : []
  }, [events, todayKey])

  const upcomingEvents = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() + 1) // Start from tomorrow

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
      .slice(0, 20)
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
    setSelectedDay(now.getDate())
  }

  function keyForDay(day) {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  function selectDay(day) {
    if (!day) return
    setSelectedDay(day)
  }

  function initializeModalState(dateObj) {
    const now = dayjs()
    setModalTaskName('')
    setModalTaskDescription('')
    setModalCreatedAt(now.toISOString())
    if (hasPlans) {
      setModalPlanId(prev => {
        if (prev && plans.some(plan => plan.id === prev)) {
          return prev
        }
        return plans[0].id
      })
    } else {
      setModalPlanId('')
    }

    const base = dateObj ? dayjs(dateObj) : now
    const start = base.hour(now.hour()).minute(now.minute()).second(0).millisecond(0)
    setModalStartAt(start.format('YYYY-MM-DDTHH:mm'))
    setModalDate(dateObj ?? start.toDate())
  }

  function openModalForDay(day) {
    selectDay(day)
    const modalDateObj = new Date(currentYear, currentMonth, day, 0, 0, 0, 0)
    initializeModalState(modalDateObj)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setModalDate(null)
    setModalTaskName('')
    setModalTaskDescription('')
  }

  function handleSaveEvent(event) {
    event.preventDefault()
    if (!modalDate || !modalPlanId) return
    const name = modalTaskName.trim()
    if (!name) return

    const description = modalTaskDescription.trim()
    const createdAt = modalCreatedAt || dayjs().toISOString()
    const parsedStart = modalStartAt ? dayjs(modalStartAt) : null
    const startAt = parsedStart?.isValid()
      ? parsedStart.toISOString()
      : dayjs(modalDate).toISOString()

    addTask(modalPlanId, {
      title: name,
      description,
      createdAt,
      startAt,
    })

    if (modalDateKey) {
      setEvents(prev => {
        const next = { ...prev }
        const existing = Array.isArray(next[modalDateKey]) ? next[modalDateKey] : []
        const planTitle = plans.find(plan => plan.id === modalPlanId)?.title ?? ''
        const entryLabel = planTitle ? `${name} · ${planTitle}` : name
        next[modalDateKey] = [...existing, entryLabel]
        return next
      })
    }

    closeModal()
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
    let targetDay = selectedDay
    let targetMonth = currentMonth
    let targetYear = currentYear

    if (!selectedDay) {
      const now = new Date()
      targetMonth = now.getMonth()
      targetYear = now.getFullYear()
      targetDay = now.getDate()
      setCurrentMonth(targetMonth)
      setCurrentYear(targetYear)
      setSelectedDay(targetDay)
    }

    const modalDateObj = new Date(targetYear, targetMonth, targetDay, 0, 0, 0, 0)
    initializeModalState(modalDateObj)
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
        openModalForDay(day)
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
      <div className="calendar-insights">
        <div className="calendar-insight-card">
          <span>{t('calendar.stats.focusDay', { defaultValue: 'Focused day' })}</span>
          <strong>{selectedDateLabel || t('calendar.stats.pickDay', { defaultValue: 'Select a day' })}</strong>
          <p>
            {t('calendar.stats.tasksPlanned', {
              defaultValue: '{{count}} tasks planned',
              count: selectedEvents.length
            })}
          </p>
        </div>
        <div className="calendar-insight-card">
          <span>{t('calendar.stats.month', { defaultValue: 'This month' })}</span>
          <strong>{totalEventsThisMonth}</strong>
          <p>{t('calendar.stats.monthHint', { defaultValue: 'Scheduled tasks across this month' })}</p>
        </div>
        <div className="calendar-insight-card">
          <span>{t('calendar.stats.nextSeven', { defaultValue: 'Next 7 days' })}</span>
          <strong>{eventsNextSevenDays}</strong>
          <p>{t('calendar.stats.nextSevenHint', { defaultValue: 'Upcoming tasks this week' })}</p>
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
                {t('calendar.actions.addTask', { defaultValue: 'Add task' })}
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
          {/* Selected Day Section */}
          <div className="calendar-sidebar-section">
            <div className="calendar-sidebar-header">
              <div>
                <h3>{selectedDateLabel}</h3>
                <p>
                  {selectedDayTasks.length > 0
                    ? t('calendar.sidebar.tasksCount', {
                        defaultValue: '{{count}} tasks',
                        count: selectedDayTasks.length
                      })
                    : t('calendar.sidebar.noTasks', { defaultValue: 'No tasks' })}
                </p>
              </div>
            </div>

            <ul className="calendar-selected-events">
              {selectedDayTasks.map((text, index) => (
                <li key={`${selectedDayKey}-${index}`}>
                  <span>{text}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEvent(index, selectedDayKey)}
                    aria-label={t('calendar.sidebar.removeTask', { defaultValue: 'Remove task' })}
                  >
                    &times;
                  </button>
                </li>
              ))}
              {selectedDayTasks.length === 0 && (
                <li className="calendar-selected-empty">
                  {t('calendar.sidebar.noTasksYet', { defaultValue: 'No tasks scheduled.' })}
                </li>
              )}
            </ul>
          </div>

          {/* Today Section */}
          <div className="calendar-sidebar-section">
            <div className="calendar-sidebar-header">
              <div>
                <h3>{t('calendar.today', { defaultValue: 'Today' })}</h3>
                <p>
                  {todaysTasks.length > 0
                    ? t('calendar.sidebar.tasksCount', {
                        defaultValue: '{{count}} tasks',
                        count: todaysTasks.length
                      })
                    : t('calendar.sidebar.noTasks', { defaultValue: 'No tasks' })}
                </p>
              </div>
            </div>

            <ul className="calendar-selected-events">
              {todaysTasks.map((text, index) => (
                <li key={`${todayKey}-${index}`}>
                  <span>{text}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEvent(index, todayKey)}
                    aria-label={t('calendar.sidebar.removeTask', { defaultValue: 'Remove task' })}
                  >
                    &times;
                  </button>
                </li>
              ))}
              {todaysTasks.length === 0 && (
                <li className="calendar-selected-empty">
                  {t('calendar.sidebar.noTasksYet', { defaultValue: 'No tasks for today.' })}
                </li>
              )}
            </ul>
          </div>

          {/* Upcoming Section */}
          <div className="calendar-sidebar-section">
            <div className="calendar-sidebar-header">
              <h3>{t('calendar.sidebar.upcomingTitle', { defaultValue: 'Upcoming' })}</h3>
            </div>
            <ul className="calendar-upcoming-list">
              {upcomingEvents.length === 0 && (
                <li className="calendar-upcoming-empty">
                  {t('calendar.sidebar.upcomingEmpty', { defaultValue: 'No upcoming tasks.' })}
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
                    aria-label={t('calendar.sidebar.removeTask', { defaultValue: 'Remove task' })}
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
          <div
            className="modal calendar-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendar-add-task-title"
            onClick={event => event.stopPropagation()}
          >
            <header className="calendar-modal__header">
              <h2 className="calendar-modal__title" id="calendar-add-task-title">
                {t('calendar.modal.title', { defaultValue: 'Schedule a task' })}
              </h2>
              <p className="calendar-modal__subtitle">{modalDateLabel}</p>
            </header>

            {!hasPlans && (
              <p className="calendar-modal__note">
                {t('calendar.modal.noPlans', {
                  defaultValue: 'Create a plan on the dashboard to start scheduling tasks.',
                })}
              </p>
            )}

            {modalEvents.length > 0 && (
              <section className="calendar-modal-existing">
                <span className="calendar-modal-section">
                  {t('calendar.modal.existing', { defaultValue: 'Tasks already scheduled' })}
                </span>
                <ul>
                  {modalEvents.map((text, index) => (
                    <li key={index}>{text}</li>
                  ))}
                </ul>
              </section>
            )}

            <form className="calendar-modal-form" onSubmit={handleSaveEvent}>
              <div className="calendar-modal-field">
                <label htmlFor="calendar-modal-plan">
                  {t('calendar.modal.planLabel', { defaultValue: 'Plan' })}
                </label>
                <select
                  id="calendar-modal-plan"
                  className="calendar-modal-input"
                  value={modalPlanId}
                  onChange={event => setModalPlanId(event.target.value)}
                  disabled={!hasPlans}
                >
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="calendar-modal-field">
                <label htmlFor="calendar-modal-name">
                  {t('calendar.modal.nameLabel', { defaultValue: 'Task name' })}
                </label>
                <input
                  id="calendar-modal-name"
                  className="calendar-modal-input"
                  placeholder={t('calendar.modal.namePlaceholder', {
                    defaultValue: 'Focus session or deliverable',
                  })}
                  value={modalTaskName}
                  onChange={event => setModalTaskName(event.target.value)}
                  required
                  disabled={!hasPlans}
                />
              </div>

              <div className="calendar-modal-field">
                <label htmlFor="calendar-modal-description">
                  {t('calendar.modal.descriptionLabel', { defaultValue: 'Description (optional)' })}
                </label>
                <textarea
                  id="calendar-modal-description"
                  className="calendar-modal-input calendar-modal-textarea"
                  rows={3}
                  placeholder={t('calendar.modal.descriptionPlaceholder', {
                    defaultValue: 'Add context, resources, or checkpoints.',
                  })}
                  value={modalTaskDescription}
                  onChange={event => setModalTaskDescription(event.target.value)}
                  disabled={!hasPlans}
                />
              </div>

              <div className="calendar-modal-grid">
                <div className="calendar-modal-field">
                  <label htmlFor="calendar-modal-created">
                    {t('calendar.modal.createdLabel', { defaultValue: 'Created' })}
                  </label>
                  <input
                    id="calendar-modal-created"
                    className="calendar-modal-input"
                    type="text"
                    value={modalCreatedDisplay}
                    readOnly
                  />
                </div>
                <div className="calendar-modal-field">
                  <label htmlFor="calendar-modal-start">
                    {t('calendar.modal.startLabel', { defaultValue: 'Start date & time' })}
                  </label>
                  <input
                    id="calendar-modal-start"
                    className="calendar-modal-input"
                    type="datetime-local"
                    value={modalStartAt}
                    onChange={event => {
                      setModalStartAt(event.target.value)
                      const parsed = dayjs(event.target.value)
                      if (parsed.isValid()) {
                        setModalDate(parsed.toDate())
                      }
                    }}
                    disabled={!hasPlans}
                  />
                </div>
              </div>

              <div className="calendar-modal-actions">
                <button type="button" className="btn ghost" onClick={closeModal}>
                  {t('buttons.cancel')}
                </button>
                <button type="submit" className="btn cat-primary" disabled={!hasPlans}>
                  {t('calendar.modal.save', { defaultValue: 'Save task' })}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
