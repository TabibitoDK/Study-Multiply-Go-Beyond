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
  PawPrint
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
  location: '東京',
  temperature: '7°C',
  condition: 'Broken Clouds',
  high: '12°C',
  low: '6°C',
  icon: '🌥'
}

const PROGRESS_TRACKERS = [
  { id: 'day', label: '今日', value: 58 },
  { id: 'week', label: '今週', value: 12 },
  { id: 'month', label: '今月', value: 42 },
  { id: 'year', label: '今年', value: 74 }
]

const DUE_ASSIGNMENTS = [
  {
    id: 'wk-1',
    course: '線形代数',
    title: '課題セット5',
    status: '進行中',
    dueDate: '2025-10-16T09:00:00'
  },
  {
    id: 'wk-2',
    course: '現代物理学',
    title: '実験レポート草案',
    status: 'アウトライン作成が必要',
    dueDate: '2025-10-18T17:00:00'
  },
  {
    id: 'mo-1',
    course: '電子工学実験',
    title: '回路設計デモ',
    status: '試作品準備完了',
    dueDate: '2025-10-24T12:00:00'
  },
  {
    id: 'mo-2',
    course: '日本語II',
    title: '口頭発表',
    status: 'スライド作成中',
    dueDate: '2025-10-28T09:00:00'
  }
]

const FOCUS_AREAS = [
  {
    id: 'deep-work',
    title: '集中ブロック',
    description: '昼食前に線形代数の証明に90分取り組む。'
  },
  {
    id: 'review',
    title: '復習ループ',
    description: '夕食後に15分のAnki復習セッション。'
  },
  {
    id: 'wellbeing',
    title: 'リフレッシュ',
    description: '集中ブロックの合間にストレッチと深呼吸。'
  }
]

const PLAYLISTS = [
  {
    id: 'lofi-bakery',
    title: '韓国カフェ風ローファイ',
    url: 'https://www.youtube.com/embed/7NOSDKb0HlU'
  },
  {
    id: 'dog-park',
    title: 'ドッグパークのそよ風ローファイ',
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
  if (!Number.isFinite(value)) return '0 時間'
  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(1)
  return `${rounded} 時間`
}

function StudyStatusPanel({ stats, onOpenProfile }) {
  const { t } = useTranslation()

  if (!stats || stats.length === 0) {
    return (
      <div className="study-status-panel empty">
        <p className="study-status-empty-title">
          {t('home.studyStatus.emptyTitle', {
            defaultValue: 'Add books to your library to unlock insights.',
          })}
        </p>
        <p className="study-status-empty-copy">
          {t('home.studyStatus.emptyCopy', {
            defaultValue: 'We will surface weekly and monthly study trends for every subject you are reading.',
          })}
        </p>
        <div className="study-status-empty-actions">
          {typeof onOpenProfile === 'function' && (
            <button type="button" className="btn ghost" onClick={onOpenProfile}>
              {t('home.studyStatus.viewProfile', { defaultValue: 'View profile' })}
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
      ? t('home.studyStatus.onPar', { defaultValue: 'On par with last week' })
      : t('home.studyStatus.changeCompared', {
          defaultValue: `${formatPercent(weeklyDelta)} vs last week`,
          value: formatPercent(weeklyDelta),
        })
  const summaryChangeClass = getTrendDirection(weeklyDelta)

  return (
    <div className="study-status-panel simple">
      <div className="status-summary">
        <div className="status-summary-main">
          <span className="status-summary-label">
            {t('home.studyStatus.summary.thisWeek', { defaultValue: 'This week' })}
          </span>
          <strong className="status-summary-value">{formatHours(totalCurrentWeek)}</strong>
          <span className={`status-summary-change ${summaryChangeClass}`}>
            {summaryChangeLabel}
          </span>
        </div>
        <div className="status-summary-side">
          <div className="summary-side-item">
            <span className="summary-side-label">
              {t('home.studyStatus.summary.lastWeek', { defaultValue: 'Last week' })}
            </span>
            <span className="summary-side-value">{formatHours(totalLastWeek)}</span>
          </div>
          <div className="summary-side-item">
            <span className="summary-side-label">
              {t('home.studyStatus.summary.topFocus', { defaultValue: 'Top focus' })}
            </span>
            <span className="summary-side-value">
              {topSubject.subject === 'General'
                ? t('home.studyStatus.generalSubject', { defaultValue: 'General' })
                : topSubject.subject}
            </span>
          </div>
          <div className="summary-side-item">
            <span className="summary-side-label">
              {t('home.studyStatus.summary.thisMonth', { defaultValue: 'This month' })}
            </span>
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
              ? t('home.studyStatus.summary.noChange', { defaultValue: 'No change' })
              : t('home.studyStatus.changeCompared', {
                  defaultValue: `${formatPercent(subject.weeklyChange)} vs last week`,
                  value: formatPercent(subject.weeklyChange),
                })

          return (
            <li key={subject.subject} className="subject-progress-item">
              <div className="subject-progress-header">
                <span className="subject-pill small" style={pillStyle}>
                  {subject.subject === 'General'
                    ? t('home.studyStatus.generalSubject', { defaultValue: 'General' })
                    : subject.subject}
                </span>
                <span className="subject-progress-hours">{formatHours(subject.currentWeek)}</span>
              </div>
              <div
                className="subject-graph"
                role="img"
                aria-label={t('home.studyStatus.aria.weekComparison', {
                  defaultValue: `This week ${formatHours(subject.currentWeek)}, last week ${formatHours(subject.lastWeek)}`,
                  current: formatHours(subject.currentWeek),
                  previous: formatHours(subject.lastWeek),
                })}
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
                  <span>
                    {t('home.studyStatus.summary.thisWeek', { defaultValue: 'This week' })}
                  </span>
                  <span>
                    {t('home.studyStatus.summary.lastWeek', { defaultValue: 'Last week' })}
                  </span>
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
            {t('home.studyStatus.openLog', { defaultValue: 'Open study log' })}
          </button>
        </div>
      )}
    </div>
  )
}

function MiniCalendar() {
  const [reference, setReference] = useState(dayjs().startOf('month'))
  const today = dayjs()
  const { t } = useTranslation()
  const { formatDate } = useI18nFormats()
  const start = useMemo(() => reference.startOf('week'), [reference])
  const days = useMemo(
    () => Array.from({ length: 42 }, (_, index) => start.add(index, 'day')),
    [start],
  )
  const monthLabel = useMemo(
    () => formatDate(reference.toDate(), { year: 'numeric', month: 'long' }),
    [reference, formatDate],
  )
  const weekdayLabels = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        formatDate(start.add(index, 'day').toDate(), { weekday: 'short' }),
      ),
    [start, formatDate],
  )

  function go(offset) {
    setReference(prev => prev.add(offset, 'month'))
  }

  return (
    <div className="home-calendar">
      <div className="home-calendar-header">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label={t('home.calendar.previous', { defaultValue: 'Previous month' })}
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <span className="home-calendar-title">{monthLabel}</span>
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label={t('home.calendar.next', { defaultValue: 'Next month' })}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="home-calendar-weekdays">
        {weekdayLabels.map(label => (
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

export default function HomeDashboard({
  user,
  onOpenProfile,
  currentTask = null,
  onSetCurrentTask,
  onCompleteTask,
}) {
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
  const defaultGoals = useMemo(
    () => [
      {
        text: t('home.goals.defaults.honors', { defaultValue: 'Graduate with honors' }),
        isPublic: true,
      },
      {
        text: t('home.goals.defaults.react', { defaultValue: 'Master React' }),
        isPublic: true,
      },
      {
        text: t('home.goals.defaults.projects', { defaultValue: 'Build 5 projects' }),
        isPublic: true,
      },
    ],
    [t],
  )
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editModalType, setEditModalType] = useState(null)
  const [editModalValue, setEditModalValue] = useState(null)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [modalDate, setModalDate] = useState(null)
  const [draftText, setDraftText] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)
  const [showTimeInput, setShowTimeInput] = useState(false)
  const [timeSpentInput, setTimeSpentInput] = useState('')
  const [timeSpentError, setTimeSpentError] = useState('')
  const [goals, setGoals] = useState(() => {
    if (typeof window === 'undefined') return defaultGoals
    try {
      const raw = window.localStorage.getItem(GOALS_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
      // Return default goals if none exist
      return defaultGoals
    } catch {
      return defaultGoals
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
    const fallback = t('home.header.fallbackName', { defaultValue: 'Student' })
    if (!user?.name) return fallback
    const [first] = user.name.split(' ')
    return (first ?? user.name) || fallback
  }, [user, t])
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

  const welcomePrefix = t('home.header.welcomePrefix', { defaultValue: 'Welcome back, ' })
  const welcomeSuffix = t('home.header.welcomeSuffix', { defaultValue: '' })
  const weatherCondition = t('home.weather.condition', { defaultValue: WEATHER_SUMMARY.condition })
  const tasksTitle = t('home.tasks.title', { defaultValue: 'Tasks' })
  const addTaskLabel = t('home.tasks.add', { defaultValue: 'Add task' })
  const todayLabel = t('home.tasks.today', { defaultValue: 'Today' })
  const noTasksTodayLabel = t('home.tasks.noneToday', { defaultValue: 'No tasks for today' })
  const upcomingLabel = t('home.tasks.upcoming', { defaultValue: 'Upcoming' })
  const removeTaskAria = t('home.tasks.removeAria', { defaultValue: 'Remove task' })
  const currentTaskBadgeLabel = t('home.tasks.currentBadge', { defaultValue: 'Current' })
  const taskActionsTitle = t('home.tasks.actions.title', { defaultValue: 'Task actions' })
  const taskScheduledLabel = date =>
    t('home.tasks.actions.scheduledFor', {
      defaultValue: 'Scheduled for {{date}}',
      date,
    })
  const setCurrentTaskLabel = t('home.tasks.actions.setCurrent', {
    defaultValue: 'Set as current task',
  })
  const endTaskLabel = t('home.tasks.actions.end', { defaultValue: 'End task' })
  const confirmEndLabel = t('home.tasks.actions.confirm', { defaultValue: 'Save session' })
  const timePromptLabel = t('home.tasks.actions.timePrompt', { defaultValue: 'Time spent' })
  const timePlaceholderLabel = t('home.tasks.actions.timePlaceholder', {
    defaultValue: 'e.g., 45 minutes',
  })
  const alreadyCurrentLabel = t('home.tasks.actions.alreadyCurrent', {
    defaultValue: 'This is already your current task.',
  })
  const taskTimeFieldId = selectedTask
    ? `task-time-${selectedTask.dayKey}-${selectedTask.eventIndex}`
    : 'task-time-input'
  const studyStatusTitle = t('home.studyStatus.title', { defaultValue: 'Study Status' })
  const studyStatusSubtitle = t('home.studyStatus.subtitle', {
    defaultValue: 'Weekly and monthly focus across every subject you are reading',
  })
  const goalsTitle = t('home.goals.title', { defaultValue: 'Goals' })
  const goalsEditLabel = t('home.goals.edit', { defaultValue: 'Edit Goals' })
  const goalsEmptyLabel = t('home.goals.empty', { defaultValue: 'No goals yet' })
  const modalTitle = t('home.tasks.modal.title', { defaultValue: 'Add task' })
  const modalDateLabelText = t('home.tasks.modal.dateLabel', { defaultValue: 'Date' })
  const modalPlaceholder = t('home.tasks.modal.placeholder', {
    defaultValue: 'Add your task here...',
  })
  const cancelLabel = t('buttons.cancel', { defaultValue: 'Cancel' })
  const saveLabel = t('buttons.save', { defaultValue: 'Save' })

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

  function openTaskActions(taskText, dayKey, eventIndex) {
    if (!taskText || !dayKey) return
    const [year, month, day] = dayKey.split('-').map(Number)
    const scheduledDate = new Date(year || today.getFullYear(), (month || 1) - 1, day || 1)
    const isValidDate = Number.isNaN(scheduledDate.getTime()) ? null : scheduledDate
    const label = isValidDate
      ? formatDate(isValidDate, { dateStyle: 'long', weekday: 'short' })
      : dayKey

    setSelectedTask({
      text: taskText,
      dayKey,
      eventIndex,
      date: isValidDate,
      label,
    })
    setShowTimeInput(false)
    setTimeSpentInput('')
    setTimeSpentError('')
  }

  function closeTaskActions() {
    setSelectedTask(null)
    setShowTimeInput(false)
    setTimeSpentInput('')
    setTimeSpentError('')
  }

  function handleSetCurrentTask() {
    if (!selectedTask) return
    if (typeof onSetCurrentTask === 'function') {
      onSetCurrentTask(selectedTask.text)
    }
    closeTaskActions()
  }

  function beginEndTaskFlow() {
    setShowTimeInput(true)
    setTimeSpentError('')
  }

  function cancelEndTaskFlow() {
    setShowTimeInput(false)
    setTimeSpentInput('')
    setTimeSpentError('')
  }

  function handleConfirmEndTask(event) {
    event.preventDefault()
    if (!selectedTask) return
    const timeValue = timeSpentInput.trim()
    if (!timeValue) {
      setTimeSpentError(
        t('home.tasks.actions.timeError', { defaultValue: 'Please enter the time you spent.' })
      )
      return
    }
    if (typeof onCompleteTask === 'function') {
      onCompleteTask(selectedTask.text, timeValue)
    }
    handleRemoveTask(selectedTask.eventIndex, selectedTask.dayKey)
    closeTaskActions()
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
          <h1>
            {welcomePrefix}
            <span>{firstName}</span>
            {welcomeSuffix}
          </h1>
        </div>

        <div className="home-clock-compact">
          <ClockWidget />
        </div>

        <div className="home-weather-compact">
          <span className="weather-icon">{WEATHER_SUMMARY.icon}</span>
          <div className="weather-info">
            <span className="weather-temp">{WEATHER_SUMMARY.temperature}</span>
            <span className="weather-condition">{weatherCondition}</span>
          </div>
        </div>
      </header>

      {/* Main Content: 3 Columns */}
      <div className="home-main-grid">
        {/* Left Column: Tasks */}
        <section className="home-section">
          <div className="section-header">
            <h2>{tasksTitle}</h2>
            <button
              type="button"
              className="btn cat-primary add-task-btn"
              onClick={openTaskModal}
            >
              <PawPrint size={18} />
              {addTaskLabel}
            </button>
          </div>
          <div className="section-content">
            <div className="home-tasks-container">
              {/* Today's Tasks */}
              <div className="home-tasks-section">
                <h3 className="home-tasks-section-title">{todayLabel}</h3>
                <ul className="home-tasks-list">
                  {todaysTasks.map((task, index) => {
                    const isCurrent = currentTask?.title === task
                    const handleTrigger = () => openTaskActions(task, todayKey, index)
                    const handleTriggerKey = event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        handleTrigger()
                      }
                    }
                    return (
                      <li
                        key={`${todayKey}-${index}`}
                        className={`home-task-item${isCurrent ? ' is-current' : ''}`}
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          className="home-task-trigger"
                          onClick={handleTrigger}
                          onKeyDown={handleTriggerKey}
                        >
                          <span className="home-task-text">{task}</span>
                          {isCurrent && (
                            <span className="home-task-badge">{currentTaskBadgeLabel}</span>
                          )}
                        </div>
                        <button
                          type="button"
                          className="home-task-remove"
                          onClick={event => {
                            event.stopPropagation()
                            handleRemoveTask(index, todayKey)
                          }}
                          aria-label={removeTaskAria}
                        >
                          &times;
                        </button>
                      </li>
                    )
                  })}
                  {todaysTasks.length === 0 && (
                    <li className="home-task-empty">{noTasksTodayLabel}</li>
                  )}
                </ul>
              </div>

              {/* Upcoming Tasks */}
              {upcomingEvents.length > 0 && (
                <div className="home-tasks-section">
                  <h3 className="home-tasks-section-title">{upcomingLabel}</h3>
                  <ul className="home-tasks-list">
                    {upcomingEvents.map(item => {
                      const isCurrent = currentTask?.title === item.text
                      const handleTrigger = () => openTaskActions(item.text, item.dayKey, item.eventIndex)
                      const handleTriggerKey = event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          handleTrigger()
                        }
                      }
                      return (
                        <li
                          key={item.id}
                          className={`home-task-item home-upcoming-item${isCurrent ? ' is-current' : ''}`}
                        >
                          <div
                            role="button"
                            tabIndex={0}
                            className="home-task-trigger"
                            onClick={handleTrigger}
                            onKeyDown={handleTriggerKey}
                          >
                            <span className="home-upcoming-date">{item.label}</span>
                            <span className="home-task-text">{item.text}</span>
                            {isCurrent && (
                              <span className="home-task-badge">{currentTaskBadgeLabel}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            className="home-task-remove"
                            onClick={event => {
                              event.stopPropagation()
                              handleRemoveTask(item.eventIndex, item.dayKey)
                            }}
                            aria-label={removeTaskAria}
                          >
                            &times;
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Middle Column: Study Status */}
        <section className="home-section">
          <div className="section-header">
            <h2>{studyStatusTitle}</h2>
            {subjectStats.length > 0 && (
              <p className="section-subtitle">{studyStatusSubtitle}</p>
            )}
          </div>
          <div className="section-content">
            <StudyStatusPanel stats={subjectStats} onOpenProfile={onOpenProfile} />
          </div>
        </section>

        {/* Right Column: Goals */}
        <section className="home-section">
          <div className="section-header">
            <h2>{goalsTitle}</h2>
            <button
              type="button"
              className="edit-icon-btn"
              title={goalsEditLabel}
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
                <span className="profile-tag">{goalsEmptyLabel}</span>
              )}
            </div>
          </div>
        </section>
      </div>

      {taskModalOpen && (
        <div className="modal-overlay" onClick={closeTaskModal}>
          <div className="modal calendar-modal" onClick={event => event.stopPropagation()}>
            <h2 className="modal-title">{modalTitle}</h2>

            <div className="calendar-modal-date-picker">
              <label htmlFor="modal-date">{modalDateLabelText}</label>
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
                placeholder={modalPlaceholder}
                value={draftText}
                onChange={event => setDraftText(event.target.value)}
              />
              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={closeTaskModal}>
                  {cancelLabel}
                </button>
                <button type="submit" className="btn">
                  {saveLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTask && (
        <div className="modal-overlay" onClick={closeTaskActions}>
          <div
            className="modal calendar-modal task-action-modal"
            onClick={event => event.stopPropagation()}
          >
            <h2 className="modal-title">{taskActionsTitle}</h2>
            <p className="task-action-date">{taskScheduledLabel(selectedTask.label)}</p>
            <p className="task-action-text">{selectedTask.text}</p>
            {currentTask?.title === selectedTask.text && (
              <p className="task-action-hint">{alreadyCurrentLabel}</p>
            )}
            <div className="task-action-buttons">
              <button
                type="button"
                className="btn cat-primary"
                onClick={handleSetCurrentTask}
                disabled={currentTask?.title === selectedTask.text}
              >
                {setCurrentTaskLabel}
              </button>
              <button
                type="button"
                className="btn cat-secondary"
                onClick={beginEndTaskFlow}
                disabled={showTimeInput}
              >
                {endTaskLabel}
              </button>
            </div>
            {showTimeInput && (
              <form className="task-action-form" onSubmit={handleConfirmEndTask}>
                <label className="task-action-label" htmlFor={taskTimeFieldId}>
                  {timePromptLabel}
                </label>
                <input
                  id={taskTimeFieldId}
                  type="text"
                  className="input"
                  value={timeSpentInput}
                  onChange={event => {
                    setTimeSpentInput(event.target.value)
                    if (timeSpentError) {
                      setTimeSpentError('')
                    }
                  }}
                  placeholder={timePlaceholderLabel}
                  autoFocus
                />
                {timeSpentError && <p className="task-action-error">{timeSpentError}</p>}
                <div className="modal-actions">
                  <button type="button" className="btn ghost" onClick={cancelEndTaskFlow}>
                    {cancelLabel}
                  </button>
                  <button type="submit" className="btn">
                    {confirmEndLabel}
                  </button>
                </div>
              </form>
            )}
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


