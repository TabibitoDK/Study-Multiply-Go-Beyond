import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  PlayCircle,
  Sparkles,
  Target
} from 'lucide-react'
import ClockWidget from './widgets/ClockWidget.jsx'
import TimerWidget from './widgets/TimerWidget.jsx'
import TodoWidget from './widgets/TodoWidget.jsx'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1800&q=80'

const NAVIGATION_CARDS = [
  {
    id: 'planner',
    label: 'Study Planner',
    caption: 'Curate today’s sessions, timers, and breaks.',
    accent: '#f97316',
    tab: 'tools'
  },
  {
    id: 'calendar',
    label: 'Calendar',
    caption: 'Preview exams, labs, and important checkpoints.',
    accent: '#38bdf8',
    tab: 'calendar'
  },
  {
    id: 'community',
    label: 'Community Feed',
    caption: 'Share wins and see what your friends are up to.',
    accent: '#a855f7',
    tab: 'social'
  }
]

const QUICK_LINKS = [
  { id: 'course-1', label: 'Linear Algebra', emoji: '📘' },
  { id: 'course-2', label: 'Modern Physics', emoji: '🧪' },
  { id: 'course-3', label: 'Technical Writing', emoji: '📝' },
  { id: 'course-4', label: 'Electronics Lab', emoji: '🔧' },
  { id: 'course-5', label: 'Japanese II', emoji: '🌸' }
]

const PROGRESS_TRACKERS = [
  { id: 'day', label: 'Day', value: 58 },
  { id: 'week', label: 'Week', value: 12 },
  { id: 'month', label: 'Month', value: 42 },
  { id: 'year', label: 'Year', value: 74 }
]

const DAILY_PROMPTS = [
  {
    id: 'priorities',
    question: 'What are my top three priorities today?',
    hint: 'Pick one deep work block, one admin task, and one wellbeing goal.'
  },
  {
    id: 'outcome',
    question: 'What does a successful day look like?',
    hint: 'Define the outcome that would make you feel accomplished tonight.'
  },
  {
    id: 'support',
    question: 'Who or what can support my focus?',
    hint: 'Prep materials, study groups, playlists, or accountability buddies.'
  }
]

const WEEK_ASSIGNMENTS = [
  {
    id: 'wk-1',
    course: 'Linear Algebra',
    title: 'Problem Set 5',
    due: 'Wed · Oct 16',
    status: 'In progress'
  },
  {
    id: 'wk-2',
    course: 'Modern Physics',
    title: 'Lab Report Draft',
    due: 'Fri · Oct 18',
    status: 'Needs outline'
  }
]

const MONTH_ASSIGNMENTS = [
  {
    id: 'mo-1',
    course: 'Electronics Lab',
    title: 'Circuit Design Demo',
    due: 'Oct 24',
    status: 'Prototype ready'
  },
  {
    id: 'mo-2',
    course: 'Japanese II',
    title: 'Oral Presentation',
    due: 'Oct 28',
    status: 'Slides in progress'
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
    title: "vibin' at the dog park · breeze edition",
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

export default function HomeDashboard({ user, onNavigate, onOpenProfile }) {
  const firstName = useMemo(() => {
    if (!user?.name) return 'Student'
    const [first] = user.name.split(' ')
    return first ?? user.name
  }, [user])

  return (
    <div className="home-dashboard">
      <section className="home-hero" style={{ backgroundImage: `url(${HERO_IMAGE})` }}>
        <div className="home-hero-overlay" />
        <div className="home-hero-content">
          <div className="home-hero-text">
            <span className="home-hero-eyebrow">your student dashboard</span>
            <h1>
              Build momentum today, <span>{firstName}</span>
            </h1>
            <p>
              Align your focus blocks, track assignments, and celebrate the small wins that
              stack into big breakthroughs.
            </p>
            <div className="home-hero-tags">
              <span className="home-chip">
                <Sparkles size={16} aria-hidden />
                Week 7 · Fall Semester
              </span>
              <span className="home-chip">
                <Target size={16} aria-hidden />
                Deep work goal · 3 hrs
              </span>
            </div>
          </div>

          <div className="home-hero-widgets">
            <div className="home-card home-hero-card">
              <div className="home-card-header">
                <span className="home-card-title">Current Time</span>
                <span className="home-card-subtitle">Stay anchored in the present block</span>
              </div>
              <ClockWidget />
            </div>
            <div className="home-card home-hero-card">
              <div className="home-card-header">
                <span className="home-card-title">Session Timer</span>
                <span className="home-card-subtitle">Switch modes as you shift energy</span>
              </div>
              <TimerWidget />
            </div>
          </div>
        </div>
      </section>

      <div className="home-grid">
        <div className="home-column">
          <section className="home-card">
            <div className="home-section-header">
              <h2>Today&apos;s To-dos</h2>
              <span>Keep it light but consistent.</span>
            </div>
            <TodoWidget />
          </section>

          <section className="home-card">
            <div className="home-section-header">
              <h2>Navigation</h2>
              <span>Jump straight into a workspace.</span>
            </div>
            <div className="home-nav-grid">
              {NAVIGATION_CARDS.map(card => (
                <button
                  key={card.id}
                  type="button"
                  className="home-nav-card"
                  style={{ '--nav-accent': card.accent }}
                  onClick={() => {
                    if (card.tab) {
                      onNavigate?.(card.tab)
                    }
                  }}
                >
                  <strong>{card.label}</strong>
                  <span>{card.caption}</span>
                  <span className="home-nav-dot" aria-hidden />
                </button>
              ))}
              <button
                type="button"
                className="home-nav-card"
                style={{ '--nav-accent': '#facc15' }}
                onClick={() => onOpenProfile?.()}
              >
                <strong>Profile Snapshot</strong>
                <span>Review highlights &amp; activity log.</span>
                <span className="home-nav-dot" aria-hidden />
              </button>
            </div>
          </section>

          <section className="home-card">
            <div className="home-section-header">
              <h2>Quick Links</h2>
              <span>Open course dashboards in a click.</span>
            </div>
            <ul className="home-list">
              {QUICK_LINKS.map(link => (
                <li key={link.id}>
                  <button type="button">
                    <span className="home-list-icon">{link.emoji}</span>
                    <span>{link.label}</span>
                    <ExternalLink size={16} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="home-card">
            <div className="home-section-header">
              <h2>Progress Pulse</h2>
              <span>Track how consistent the week feels.</span>
            </div>
            <div className="home-progress">
              {PROGRESS_TRACKERS.map(track => (
                <div key={track.id} className="home-progress-row">
                  <div className="home-progress-label">
                    <span>{track.label}</span>
                    <span>{track.value}%</span>
                  </div>
                  <div className="home-progress-bar">
                    <div style={{ width: `${track.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="home-card">
            <div className="home-section-header">
              <h2>Focus Areas</h2>
              <span>Intentional anchors for the day.</span>
            </div>
            <ul className="home-focus-list">
              {FOCUS_AREAS.map(area => (
                <li key={area.id}>
                  <strong>{area.title}</strong>
                  <p>{area.description}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="home-column home-column-wide">
          <section className="home-card home-quote">
            <p>
              “Grant me the serenity to accept the things I cannot change, the courage to change
              the things I can, and the wisdom to know the difference.”
            </p>
            <span>Swap in the affirmation you need most today.</span>
          </section>

          <section className="home-card home-weather">
            <div className="home-section-header">
              <div>
                <h2>Vancouver</h2>
                <span>Weather snapshot for the week.</span>
              </div>
              <div className="home-weather-now">
                <strong>7°C</strong>
                <span>Broken Clouds</span>
              </div>
            </div>
            <div className="home-weather-grid">
              {[
                { day: 'Mon', high: '10°C', low: '7°C', icon: '🌧' },
                { day: 'Tue', high: '12°C', low: '5°C', icon: '⛅' },
                { day: 'Wed', high: '12°C', low: '6°C', icon: '🌦' },
                { day: 'Thu', high: '12°C', low: '7°C', icon: '🌥' },
                { day: 'Fri', high: '12°C', low: '7°C', icon: '🌧' },
                { day: 'Sat', high: '12°C', low: '9°C', icon: '🌦' },
                { day: 'Sun', high: '10°C', low: '9°C', icon: '🌧' }
              ].map(item => (
                <div key={item.day} className="home-weather-cell">
                  <span className="home-weather-day">{item.day}</span>
                  <span className="home-weather-icon" role="img" aria-label="weather icon">
                    {item.icon}
                  </span>
                  <span className="home-weather-temp">{item.high}</span>
                  <span className="home-weather-temp low">{item.low}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="home-card">
            <div className="home-section-header">
              <h2>Daily Check-in</h2>
              <span>Prime your mind before you start.</span>
            </div>
            <ul className="home-prompts">
              {DAILY_PROMPTS.map(prompt => (
                <li key={prompt.id}>
                  <strong>{prompt.question}</strong>
                  <p>{prompt.hint}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="home-card">
            <div className="home-section-header">
              <h2>Due within the week</h2>
              <span>Keep these moving forward.</span>
            </div>
            <div className="home-assignment-list">
              {WEEK_ASSIGNMENTS.map(item => (
                <article key={item.id}>
                  <header>
                    <span className="home-assignment-course">{item.course}</span>
                    <span className="home-assignment-date">{item.due}</span>
                  </header>
                  <h3>{item.title}</h3>
                  <p>{item.status}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="home-card">
            <div className="home-section-header">
              <h2>Due within the next month</h2>
              <span>Break these into manageable checkpoints.</span>
            </div>
            <div className="home-assignment-list">
              {MONTH_ASSIGNMENTS.map(item => (
                <article key={item.id}>
                  <header>
                    <span className="home-assignment-course">{item.course}</span>
                    <span className="home-assignment-date">{item.due}</span>
                  </header>
                  <h3>{item.title}</h3>
                  <p>{item.status}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="home-column">
          <section className="home-card home-plant-card">
            <img
              src="https://64.media.tumblr.com/844419d4b5400fed08246e6fbf0ccb20/tumblr_inline_prlxb8ltqG1v11u1e_540.gif"
              alt="Pixel art plants"
            />
          </section>

          <section className="home-card">
            <div className="home-section-header">
              <h2>Monthly Calendar</h2>
              <span>Plot your focus sprints and rest days.</span>
            </div>
            <MiniCalendar />
          </section>

          <section className="home-card home-profile-card">
            <div className="home-section-header">
              <h2>About me</h2>
              <span>Reconnect with your why.</span>
            </div>
            <ul>
              <li>
                <span>Name</span>
                <strong>{user?.name ?? 'Guest Student'}</strong>
              </li>
              <li>
                <span>Username</span>
                <strong>@{user?.username ?? 'anonymous'}</strong>
              </li>
              <li>
                <span>Location</span>
                <strong>
                  <MapPin size={14} aria-hidden />
                  {user?.location ?? 'Wherever you focus best'}
                </strong>
              </li>
              <li>
                <span>Degree path</span>
                <strong>Engineering + Creative Tech Exploration</strong>
              </li>
            </ul>
          </section>

          <section className="home-card home-playlist">
            <div className="home-section-header">
              <h2>Study playlist</h2>
              <span>Soundtrack the session.</span>
            </div>
            <div className="home-playlist-grid">
              {PLAYLISTS.map(item => (
                <div key={item.id} className="home-playlist-item">
                  <iframe
                    src={item.url}
                    title={item.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                  <div className="home-playlist-meta">
                    <PlayCircle size={18} aria-hidden />
                    <span>{item.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
