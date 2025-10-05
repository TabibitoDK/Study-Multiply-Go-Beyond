import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const STORAGE_KEY = 'smgb-calendar-events-v1'

export default function CalendarPage() {
  const today = new Date()
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

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
    } catch {}
  }, [events])

  const monthLabel = useMemo(
    () => new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' }),
    [currentMonth, currentYear]
  )
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

  function keyForDay(day) {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  function handleAddEvent(day) {
    const dateKey = keyForDay(day)
    if (typeof window === 'undefined') return
    const text = window.prompt('Add task or event:')
    if (!text || !text.trim()) return
    const entry = text.trim()
    setEvents(prev => {
      const next = { ...prev }
      const existing = next[dateKey] ?? []
      next[dateKey] = [...existing, entry]
      return next
    })
  }

  function handleKeyDown(event, day) {
    if (!day) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleAddEvent(day)
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
      <div className="calendar-surface">
        <div className="calendar-header">
          <div className="calendar-nav">
            <button className="calendar-nav-btn" onClick={handlePrev} aria-label="Previous month">
              <ChevronLeft size={18} />
            </button>
            <button className="calendar-nav-btn" onClick={handleNext} aria-label="Next month">
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="calendar-title">
            <h2>{monthLabel} {currentYear}</h2>
            <p>Plan your study sessions - select a day to add notes.</p>
          </div>
          <button className="btn ghost calendar-today-btn" onClick={handleReset}>
            Today
          </button>
        </div>

        <div className="calendar-weekdays">
          {WEEKDAY_LABELS.map(label => (
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
              isToday(day) && 'is-today'
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <div
                key={`${index}-${day ?? 'empty'}`}
                className={classes}
                role={day ? 'button' : undefined}
                tabIndex={day ? 0 : -1}
                onClick={() => day && handleAddEvent(day)}
                onKeyDown={event => handleKeyDown(event, day)}
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
                        <span className="calendar-event calendar-event-more">+{hiddenCount} more</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

