import { useMemo, useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { useI18nFormats } from '../lib/i18n-format.js'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  PlayCircle,
  Sparkles,
  Target,
  Edit3,
  Globe,
  Lock,
  Plus
} from 'lucide-react'
import ClockWidget from './widgets/ClockWidget.jsx'
import TodoWidget from './widgets/TodoWidget.jsx'
import ProfileEditModal from './ProfileEditModal.jsx'
import { getAllBooks } from '../lib/books.js'

const CALENDAR_STORAGE_KEY = 'smgb-calendar-events-v1'
const GOALS_STORAGE_KEY = 'smgb-user-goals-v1'

const SUBJECT_COLOR_POOL = [
  '#4f46e5',
  '#2563eb',
  '#0ea5e9',
  '#10b981',
  '#f97316',
  '#f43f5e',
  '#a855f7',
  '#14b8a6',
  '#facc15',
  '#6366f1'
]

const DEMO_SUBJECT_SAMPLES = [
  {
    subject: '化学',
    currentWeek: 12,
    lastWeek: 13.5,
    thisMonth: 46,
    lastMonth: 52,
    avgSession: 50,
    streak: 4,
    completion: 68
  },
  {
    subject: '英語',
    currentWeek: 9,
    lastWeek: 7,
    thisMonth: 33,
    lastMonth: 29,
    avgSession: 42,
    streak: 6,
    completion: 74
  },
  {
    subject: '世界史',
    currentWeek: 6,
    lastWeek: 5.5,
    thisMonth: 24,
    lastMonth: 22,
    avgSession: 35,
    streak: 3,
    completion: 61
  },
  {
    subject: 'プログラミング',
    currentWeek: 10,
    lastWeek: 9,
    thisMonth: 38,
    lastMonth: 35,
    avgSession: 55,
    streak: 7,
    completion: 80
  }
]

function hashString(value) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash)
}

function buildSubjectStats(books) {
  const subjects = new Map()

  books.forEach(book => {
    const primaryTag = Array.isArray(book.tags) && book.tags.length > 0 ? String(book.tags[0]) : book.subject ?? book.title
    const subject = (primaryTag || 'General').trim() || 'General'
    if (!subjects.has(subject)) {
      subjects.set(subject, [])
    }
    subjects.get(subject).push(book)
  })

  const stats = []
  let colorIndex = 0

  subjects.forEach((subjectBooks, subject) => {
    const color = SUBJECT_COLOR_POOL[colorIndex % SUBJECT_COLOR_POOL.length]
    const totalPages = subjectBooks.reduce((sum, current) => sum + (Number(current.pages) || 0), 0)
    const seed = hashString(subject.toLowerCase())
    const base = Math.max(5, Math.round(totalPages / 70) + 4)

    const currentWeek = Math.max(2, base + ((seed % 5) - 2))
    const lastWeek = Math.max(1, currentWeek - (((seed >> 3) % 5) - 2))
    const thisMonth = Math.max(12, currentWeek * 4 + (((seed >> 5) % 9) - 4))
    const lastMonth = Math.max(10, thisMonth - (((seed >> 7) % 9) - 4))

    const weeklyChange = lastWeek > 0 ? ((currentWeek - lastWeek) / lastWeek) * 100 : 0
    const monthlyChange = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0

    const targetHours = Math.max(thisMonth + 4, Math.round(totalPages / 20) || thisMonth + 4)
    const completion = targetHours > 0 ? Math.min(100, Math.round((thisMonth / targetHours) * 100)) : 0
    const avgSession = Math.max(25, Math.min(110, 30 + ((seed >> 9) % 70)))
    const streak = 3 + ((seed >> 11) % 7)

    stats.push({
      subject,
      books: subjectBooks,
      color,
      currentWeek,
      lastWeek,
      weeklyChange,
      thisMonth,
      lastMonth,
      monthlyChange,
      completion,
      avgSession,
      streak
    })

    colorIndex += 1
  })

  if (stats.length < 4) {
    const existingSubjects = new Set(stats.map(item => item.subject.toLowerCase()))
    DEMO_SUBJECT_SAMPLES.forEach(sample => {
      if (existingSubjects.has(sample.subject.toLowerCase())) {
        return
      }
      const color = SUBJECT_COLOR_POOL[colorIndex % SUBJECT_COLOR_POOL.length]
      const weeklyChange =
        sample.lastWeek > 0 ? ((sample.currentWeek - sample.lastWeek) / sample.lastWeek) * 100 : 0
      const monthlyChange =
        sample.lastMonth > 0 ? ((sample.thisMonth - sample.lastMonth) / sample.lastMonth) * 100 : 0

      stats.push({
        subject: sample.subject,
        books: [
          {
            id: `demo-${sample.subject.toLowerCase()}`,
            title: sample.subject.endsWith('語') ? `${sample.subject} 語彙ノート` : `${sample.subject} メモ`
          }
        ],
        color,
        currentWeek: sample.currentWeek,
        lastWeek: sample.lastWeek,
        weeklyChange,
        thisMonth: sample.thisMonth,
        lastMonth: sample.lastMonth,
        monthlyChange,
        completion: sample.completion,
        avgSession: sample.avgSession,
        streak: sample.streak,
        isDemo: true
      })
      colorIndex += 1
    })
  }

  return stats.sort((a, b) => b.currentWeek - a.currentWeek)
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return '0%'
  const rounded = Math.abs(value) >= 10 ? value.toFixed(0) : value.toFixed(1)
  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${sign}${Math.abs(Number(rounded))}%`
}

function toRgba(hex, alpha) {
  if (!hex || typeof hex !== 'string') {
    return `rgba(17, 17, 17, ${alpha})`
  }
  const sanitized = hex.replace('#', '')
  if (sanitized.length === 3) {
    const r = parseInt(sanitized[0] + sanitized[0], 16)
    const g = parseInt(sanitized[1] + sanitized[1], 16)
    const b = parseInt(sanitized[2] + sanitized[2], 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  if (sanitized.length === 6) {
    const r = parseInt(sanitized.slice(0, 2), 16)
    const g = parseInt(sanitized.slice(2, 4), 16)
    const b = parseInt(sanitized.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return `rgba(17, 17, 17, ${alpha})`
}

const WEATHER_SUMMARY = {
  location: 'Vancouver',
  temperature: '7°C',
  condition: 'Broken Clouds',
  high: '12°C',
  low: '6°C',
  icon: '🌥'
}

const PROGRESS_TRACKERS = [
  { id: 'day', label: 'Day', value: 58 },
  { id: 'week', label: 'Week', value: 12 },
  { id: 'month', label: 'Month', value: 42 },
  { id: 'year', label: 'Year', value: 74 }
]

const DUE_ASSIGNMENTS = [
  {
    id: 'wk-1',
    course: 'Linear Algebra',
    title: 'Problem Set 5',
    status: 'In progress',
    dueDate: '2025-10-16T09:00:00'
  },
  {
    id: 'wk-2',
    course: 'Modern Physics',
    title: 'Lab Report Draft',
    status: 'Needs outline',
    dueDate: '2025-10-18T17:00:00'
  },
  {
    id: 'mo-1',
    course: 'Electronics Lab',
    title: 'Circuit Design Demo',
    status: 'Prototype ready',
    dueDate: '2025-10-24T12:00:00'
  },
  {
    id: 'mo-2',
    course: 'Japanese II',
    title: 'Oral Presentation',
    status: 'Slides in progress',
    dueDate: '2025-10-28T09:00:00'
  }
]

const FOCUS_AREAS = [
  {
    id: 'deep-work',
    title: 'Deep Work',
    description: '90 minutes on Linear Algebra proofs before lunch.'
  },
  {
    id: 'review',
    title: 'Review Loop',
    description: '15 minute spaced repetition session with Anki after dinner.'
  },
  {
    id: 'wellbeing',
    title: 'Recharge',
    description: 'Stretch + fresh air break between focus blocks.'
  }
]

const PLAYLISTS = [
  {
    id: 'lofi-bakery',
    title: 'korean bakery feels [chill lofi]',
    url: 'https://www.youtube.com/embed/7NOSDKb0HlU'
  },
  {
    id: 'dog-park',
    title: "vibin' at the dog park - breeze edition",
    url: 'https://www.youtube.com/embed/YqfBrC8ZHSo'
  }
]

function getTrendDirection(value) {
  if (!Number.isFinite(value) || Math.abs(value) < 0.05) {
    return 'trend-neutral'
  }
  return value > 0 ? 'trend-up' : 'trend-down'
}

function formatHours(value) {
  if (!Number.isFinite(value)) return '0 h'
  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(1)
  return `${rounded} h`
}

function StudyStatusPanel({ stats, onOpenProfile }) {
  if (!stats || stats.length === 0) {
    return (
      <div className="study-status-panel empty">
        <p className="study-status-empty-title">Add books to your library to unlock insights.</p>
        <p className="study-status-empty-copy">
          We will surface weekly and monthly study trends for every subject you are reading.
        </p>
        <div className="study-status-empty-actions">
          {typeof onOpenProfile === 'function' && (
            <button type="button" className="btn ghost" onClick={onOpenProfile}>
              View profile
            </button>
          )}
        </div>
      </div>
    )
  }

  const totalCurrentWeek = stats.reduce((sum, item) => sum + item.currentWeek, 0)
  const totalLastWeek = stats.reduce((sum, item) => sum + item.lastWeek, 0)
  const totalThisMonth = stats.reduce((sum, item) => sum + item.thisMonth, 0)

  const weeklyDelta = totalLastWeek > 0 ? ((totalCurrentWeek - totalLastWeek) / totalLastWeek) * 100 : 0
  const topSubject = stats[0]
  const maxWeekly = Math.max(...stats.map(item => Math.max(item.currentWeek, item.lastWeek)), 1)

  const summaryChangeLabel =
    Math.abs(weeklyDelta) < 0.1
      ? 'On par with last week'
      : `${formatPercent(weeklyDelta)} vs last week`
  const summaryChangeClass = getTrendDirection(weeklyDelta)

  return (
    <div className="study-status-panel simple">
      <div className="status-summary">
        <div className="status-summary-main">
          <span className="status-summary-label">This week</span>
          <strong className="status-summary-value">{formatHours(totalCurrentWeek)}</strong>
          <span className={`status-summary-change ${summaryChangeClass}`}>
            {summaryChangeLabel}
          </span>
        </div>
        <div className="status-summary-side">
          <div className="summary-side-item">
            <span className="summary-side-label">Last week</span>
            <span className="summary-side-value">{formatHours(totalLastWeek)}</span>
          </div>
          <div className="summary-side-item">
            <span className="summary-side-label">Top focus</span>
            <span className="summary-side-value">{topSubject.subject}</span>
          </div>
          <div className="summary-side-item">
            <span className="summary-side-label">This month</span>
            <span className="summary-side-value">{formatHours(totalThisMonth)}</span>
          </div>
        </div>
      </div>

      <ul className="subject-progress-list">
        {stats.map(subject => {
          const pillStyle = {
            '--pill-color': subject.color,
            '--pill-bg': toRgba(subject.color, 0.16)
          }
          const currentPercent =
            maxWeekly > 0 ? Math.max(6, Math.round((subject.currentWeek / maxWeekly) * 100)) : 0
          const previousPercent =
            maxWeekly > 0 ? Math.max(6, Math.round((subject.lastWeek / maxWeekly) * 100)) : 0
          const changeClass = getTrendDirection(subject.weeklyChange)
          const changeLabel =
            Math.abs(subject.weeklyChange) < 0.1
              ? 'No change'
              : `${formatPercent(subject.weeklyChange)} vs last week`

          return (
            <li key={subject.subject} className="subject-progress-item">
              <div className="subject-progress-header">
                <span className="subject-pill small" style={pillStyle}>
                  {subject.subject}
                </span>
                <span className="subject-progress-hours">{formatHours(subject.currentWeek)}</span>
              </div>
              <div
                className="subject-graph"
                role="img"
                aria-label={`This week ${formatHours(subject.currentWeek)}, last week ${formatHours(subject.lastWeek)}`}
              >
                <div className="subject-graph-bars">
                  <span
                    className="subject-graph-bar current"
                    style={{ '--bar-height': `${currentPercent}%`, '--bar-color': subject.color }}
                    aria-hidden="true"
                  />
                  <span
                    className="subject-graph-bar previous"
                    style={{ '--bar-height': `${previousPercent}%` }}
                    aria-hidden="true"
                  />
                </div>
                <div className="subject-graph-legend" aria-hidden="true">
                  <span>This week</span>
                  <span>Last week</span>
                </div>
              </div>
              <div className={`subject-progress-change ${changeClass}`}>{changeLabel}</div>
            </li>
          )
        })}
      </ul>

      {typeof onOpenProfile === 'function' && (
        <div className="study-status-footer">
          <button type="button" className="btn ghost" onClick={onOpenProfile}>
            Open study log
          </button>
        </div>
      )}
    </div>
  )
}

function MiniCalendar() {
  const [reference, setReference] = useState(dayjs().startOf('month'))
  const today = dayjs()
  const start = useMemo(() => reference.startOf('week'), [reference])
  const days = useMemo(
    () => Array.from({ length: 42 }, (_, index) => start.add(index, 'day')),
    [start]
  )
  const monthLabel = useMemo(() => reference.format('MMMM YYYY'), [reference])

  function go(offset) {
    setReference(prev => prev.add(offset, 'month'))
  }

  return (
    <div className="home-calendar">
      <div className="home-calendar-header">
        <button type="button" onClick={() => go(-1)} aria-label="Previous month">
          <ChevronLeft size={18} />
        </button>
        <div>
          <span className="home-calendar-title">{monthLabel}</span>
        </div>
        <button type="button" onClick={() => go(1)} aria-label="Next month">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="home-calendar-weekdays">
        {Array.from({ length: 7 }, (_, index) =>
          start.add(index, 'day').format('dd')
        ).map(label => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="home-calendar-grid">
        {days.map(day => {
          const isCurrentMonth = day.month() === reference.month()
          const isToday = day.isSame(today, 'day')
          return (
            <span
              key={day.toString()}
              className={[
                'home-calendar-cell',
                !isCurrentMonth && 'is-muted',
                isToday && 'is-today'
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {day.date()}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export default function HomeDashboard({ user, onOpenProfile }) {
  const [subjectStats, setSubjectStats] = useState(() => {
    try {
      return buildSubjectStats(getAllBooks())
    } catch {
      return []
    }
  })
  const today = new Date()
  const { t } = useTranslation()
  const { formatDate } = useI18nFormats()
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editModalType, setEditModalType] = useState(null)
  const [editModalValue, setEditModalValue] = useState(null)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [modalDate, setModalDate] = useState(null)
  const [draftText, setDraftText] = useState('')
  const [goals, setGoals] = useState(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = window.localStorage.getItem(GOALS_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
      // Return default goals if none exist
      return [
        { text: 'Graduate with honors', isPublic: true },
        { text: 'Master React', isPublic: true },
        { text: 'Build 5 projects', isPublic: true }
      ]
    } catch {
      return [
        { text: 'Graduate with honors', isPublic: true },
        { text: 'Master React', isPublic: true },
        { text: 'Build 5 projects', isPublic: true }
      ]
    }
  })
  const [events, setEvents] = useState(() => {
    if (typeof window === 'undefined') return {}
    try {
      const raw = window.localStorage.getItem(CALENDAR_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  })
  const [newTaskText, setNewTaskText] = useState('')

  useEffect(() => {
    function refreshStats() {
      try {
        setSubjectStats(buildSubjectStats(getAllBooks()))
      } catch {
        setSubjectStats([])
      }
    }

    const handleStorage = event => {
      if (event?.key && event.key !== 'study-app-books-v2-json') return
      refreshStats()
    }

    refreshStats()
    window.addEventListener('focus', refreshStats)
    window.addEventListener('smgb:books-updated', refreshStats)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('focus', refreshStats)
      window.removeEventListener('smgb:books-updated', refreshStats)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(events))
    } catch {}
  }, [events])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals))
    } catch {}
  }, [goals])

  const firstName = useMemo(() => {
    if (!user?.name) return 'Student'
    const [first] = user.name.split(' ')
    return first ?? user.name
  }, [user])
  const dueItems = useMemo(
    () =>
      [...DUE_ASSIGNMENTS].sort((a, b) =>
        dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf()
      ).slice(0, 3),
    []
  )

  const getTodayKey = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }

  const todayKey = getTodayKey()

  const todaysTasks = useMemo(() => {
    return Array.isArray(events[todayKey]) ? events[todayKey] : []
  }, [events, todayKey])

  const modalDateKey = useMemo(() => {
    if (!modalDate) return null
    return `${modalDate.getFullYear()}-${String(modalDate.getMonth() + 1).padStart(2, '0')}-${String(modalDate.getDate()).padStart(2, '0')}`
  }, [modalDate])

  const modalDateLabel = useMemo(() => {
    if (!modalDate) return ''
    return formatDate(modalDate, { dateStyle: 'long' })
  }, [modalDate, formatDate])

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

  function addTask() {
    const text = newTaskText.trim()
    if (!text) return
    const key = getTodayKey()
    setEvents(prev => {
      const next = { ...prev }
      const existing = Array.isArray(next[key]) ? next[key] : []
      next[key] = [...existing, text]
      return next
    })
    setNewTaskText('')
  }

  function removeTask(index) {
    const key = getTodayKey()
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

  function openTaskModal() {
    const modalDateObj = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0)
    setModalDate(modalDateObj)
    setDraftText('')
    setTaskModalOpen(true)
  }

  function closeTaskModal() {
    setTaskModalOpen(false)
    setDraftText('')
    setModalDate(null)
  }

  function handleSaveTask(e) {
    e.preventDefault()
    if (!modalDateKey) return
    const text = draftText.trim()
    if (!text) return
    setEvents(prev => {
      const next = { ...prev }
      const existing = Array.isArray(next[modalDateKey]) ? next[modalDateKey] : []
      next[modalDateKey] = [...existing, text]
      return next
    })
    setDraftText('')
    setTaskModalOpen(false)
    setModalDate(null)
  }

  function handleRemoveTask(eventIndex, dayKey) {
    setEvents(prev => {
      const existing = Array.isArray(prev[dayKey]) ? [...prev[dayKey]] : []
      if (eventIndex < 0 || eventIndex >= existing.length) return prev
      existing.splice(eventIndex, 1)
      const next = { ...prev }
      if (existing.length === 0) {
        delete next[dayKey]
      } else {
        next[dayKey] = existing
      }
      return next
    })
  }

  function openEditModal(type, value) {
    setEditModalType(type)
    setEditModalValue(value)
    setEditModalOpen(true)
  }

  function handleEditSave(data) {
    if (editModalType === 'goals') {
      setGoals(data)
    }
  }

  return (
    <div className="home-dashboard-simple">
      {/* Header: Welcome + Clock + Weather */}
      <header className="home-header">
        <div className="home-welcome">
          <h1>Welcome back, <span>{firstName}</span></h1>
        </div>

        <div className="home-clock-compact">
          <ClockWidget />
        </div>

        <div className="home-weather-compact">
          <span className="weather-icon">{WEATHER_SUMMARY.icon}</span>
          <div className="weather-info">
            <span className="weather-temp">{WEATHER_SUMMARY.temperature}</span>
            <span className="weather-condition">{WEATHER_SUMMARY.condition}</span>
          </div>
        </div>
      </header>

      {/* Main Content: 3 Columns */}
      <div className="home-main-grid">
        {/* Left Column: Tasks */}
        <section className="home-section">
          <div className="section-header">
            <h2>Tasks</h2>
            <button
              type="button"
              className="btn"
              onClick={openTaskModal}
              style={{ padding: '8px 12px', fontSize: '0.9rem' }}
            >
              <Plus size={16} style={{ marginRight: '4px' }} />
              Add task
            </button>
          </div>
          <div className="section-content">
            <div className="home-tasks-container">
              {/* Today's Tasks */}
              <div className="home-tasks-section">
                <h3 className="home-tasks-section-title">Today</h3>
                <ul className="home-tasks-list">
                  {todaysTasks.map((task, index) => (
                    <li key={`${todayKey}-${index}`} className="home-task-item">
                      <span className="home-task-text">{task}</span>
                      <button
                        type="button"
                        className="home-task-remove"
                        onClick={() => removeTask(index)}
                        aria-label="Remove task"
                      >
                        &times;
                      </button>
                    </li>
                  ))}
                  {todaysTasks.length === 0 && (
                    <li className="home-task-empty">No tasks for today</li>
                  )}
                </ul>
              </div>

              {/* Upcoming Tasks */}
              {upcomingEvents.length > 0 && (
                <div className="home-tasks-section">
                  <h3 className="home-tasks-section-title">Upcoming</h3>
                  <ul className="home-tasks-list">
                    {upcomingEvents.map(item => (
                      <li key={item.id} className="home-task-item home-upcoming-item">
                        <div className="home-upcoming-content">
                          <span className="home-upcoming-date">{item.label}</span>
                          <span className="home-task-text">{item.text}</span>
                        </div>
                        <button
                          type="button"
                          className="home-task-remove"
                          onClick={() => handleRemoveTask(item.eventIndex, item.dayKey)}
                          aria-label="Remove task"
                        >
                          &times;
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Middle Column: Study Status */}
        <section className="home-section">
          <div className="section-header">
            <h2>Study Status</h2>
            {subjectStats.length > 0 && (
              <p className="section-subtitle">
                Weekly and monthly focus across every subject you are reading
              </p>
            )}
          </div>
          <div className="section-content">
            <StudyStatusPanel stats={subjectStats} onOpenProfile={onOpenProfile} />
          </div>
        </section>

        {/* Right Column: Goals */}
        <section className="home-section">
          <div className="section-header">
            <h2>Goals</h2>
            <button
              type="button"
              className="edit-icon-btn"
              title="Edit Goals"
              onClick={() => openEditModal('goals', goals)}
            >
              <Edit3 size={16} />
            </button>
          </div>
          <div className="section-content">
            <div className="profile-tags">
              {goals.map((goal, index) => (
                <span key={index} className="profile-tag">
                  {goal.text}
                  <span className={`privacy-icon ${goal.isPublic ? 'public' : 'private'}`}>
                    {goal.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                  </span>
                </span>
              ))}
              {goals.length === 0 && (
                <span className="profile-tag">No goals yet</span>
              )}
            </div>
          </div>
        </section>
      </div>

      {taskModalOpen && (
        <div className="modal-overlay" onClick={closeTaskModal}>
          <div className="modal calendar-modal" onClick={event => event.stopPropagation()}>
            <h2 className="modal-title">Add task</h2>

            <div className="calendar-modal-date-picker">
              <label htmlFor="modal-date">Date</label>
              <input
                id="modal-date"
                type="date"
                value={modalDate ? `${modalDate.getFullYear()}-${String(modalDate.getMonth() + 1).padStart(2, '0')}-${String(modalDate.getDate()).padStart(2, '0')}` : ''}
                onChange={(e) => {
                  const [year, month, day] = e.target.value.split('-').map(Number)
                  const newDate = new Date(year, month - 1, day, 0, 0, 0, 0)
                  setModalDate(newDate)
                }}
                className="calendar-modal-date-input"
              />
            </div>

            <p className="calendar-modal-subtitle">{modalDateLabel}</p>

            <form className="calendar-modal-form" onSubmit={handleSaveTask}>
              <textarea
                className="input calendar-modal-textarea"
                rows={4}
                placeholder="Add your task here..."
                value={draftText}
                onChange={event => setDraftText(event.target.value)}
              />
              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={closeTaskModal}>
                  Cancel
                </button>
                <button type="submit" className="btn">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ProfileEditModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleEditSave}
        type={editModalType}
        initialValue={editModalValue}
      />
    </div>
  )
}


