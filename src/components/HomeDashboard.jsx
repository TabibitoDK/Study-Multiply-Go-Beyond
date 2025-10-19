import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  PlayCircle,
  Sparkles,
  Target
} from 'lucide-react'
import ClockWidget from './widgets/ClockWidget.jsx'
import TodoWidget from './widgets/TodoWidget.jsx'

const NAVIGATION_CARDS = [
  {
    id: 'planner',
    label: 'Study Planner',
    caption: "Curate today's sessions, timers, and breaks.",
    accent: '#f97316',
    path: '/tools'
  },
  {
    id: 'calendar',
    label: 'Calendar',
    caption: 'Preview exams, labs, and important checkpoints.',
    accent: '#38bdf8',
    path: '/calendar'
  },
  {
    id: 'community',
    label: 'Community Feed',
    caption: 'Share wins and see what your friends are up to.',
    accent: '#a855f7',
    path: '/social'
  }
]

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
  const navigate = useNavigate()
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
          </div>
          <div className="section-content">
            <TodoWidget />
          </div>
        </section>

        {/* Middle Column: Navigation */}
        <section className="home-section">
          <div className="section-header">
            <h2>Navigation</h2>
          </div>
          <div className="section-content">
            <div className="nav-shortcuts">
              {NAVIGATION_CARDS.map(card => (
                <button
                  key={card.id}
                  type="button"
                  className="nav-shortcut-btn"
                  onClick={() => {
                    if (card.path) {
                      navigate(card.path)
                    }
                  }}
                >
                  <strong>{card.label}</strong>
                  <span>{card.caption}</span>
                </button>
              ))}
              <button
                type="button"
                className="nav-shortcut-btn"
                onClick={() => onOpenProfile?.()}
              >
                <strong>Profile</strong>
                <span>View your activity</span>
              </button>
            </div>
          </div>
        </section>

        {/* Right Column: Goals */}
        <section className="home-section">
          <div className="section-header">
            <h2>Goals</h2>
          </div>
          <div className="section-content">
            <div className="goals-list">
              {dueItems.map(item => {
                const dueDate = dayjs(item.dueDate)
                return (
                  <div key={item.id} className="goal-item">
                    <div className="goal-header">
                      <span className="goal-course">{item.course}</span>
                      <span className="goal-date">{dueDate.format('MMM D')}</span>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.status}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}


