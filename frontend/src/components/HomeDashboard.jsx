import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { useTaskManager } from '../context/TaskManagerContext.jsx'
import CatPeekAnimation from './CatPeekAnimation.jsx'

const STATUS_LABEL_KEYS = {
  'not-started': 'home.dashboard.longTerm.status.notStarted',
  'in-progress': 'home.dashboard.longTerm.status.inProgress',
  cancelled: 'home.dashboard.longTerm.status.cancelled',
  completed: 'home.dashboard.longTerm.status.completed',
}

const STATUS_DEFAULT_LABELS = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  cancelled: 'Cancelled',
  completed: 'Completed',
}

const TASK_STATUS_OPTIONS = ['not-started', 'in-progress', 'cancelled', 'completed']

const LONG_TERM_STATUS_OPTIONS = ['not-started', 'in-progress', 'cancelled', 'completed']

const PROGRESS_SUMMARY_RANGES = [
  { id: 'today', labelKey: 'home.progress.summary.today', defaultLabel: 'Today' },
  { id: 'week', labelKey: 'home.progress.summary.week', defaultLabel: 'This Week' },
]

const PROGRESS_TAG_VARIANTS = ['indigo', 'stone', 'teal', 'violet', 'amber', 'slate']
const PROGRESS_TAG_COLORS = {
  indigo: '#111111',
  stone: '#2d2d2d',
  teal: '#4a4a4a',
  violet: '#6b6b6b',
  amber: '#8c8c8c',
  slate: '#b1b1b1',
}

const PROGRESS_SEGMENT_COLORS = {
  indigo: '#2563eb',
  stone: '#0ea5e9',
  teal: '#10b981',
  violet: '#f97316',
  amber: '#f43f5e',
  slate: '#facc15',
}


function getMonthKey(date) {
  const ref = dayjs(date)
  if (!ref.isValid()) return null
  return ref.startOf('month').format('YYYY-MM')
}

function formatMonthLabel(key) {
  const ref = dayjs(key, 'YYYY-MM')
  if (!ref.isValid()) return key
  return ref.format('MMM YYYY')
}

function getWeekWindow(anchor = dayjs()) {
  const dayStart = anchor.startOf('day')
  const weekStart = dayStart.subtract(dayStart.day(), 'day')
  const weekEnd = weekStart.add(7, 'day')
  return { weekStart, weekEnd }
}

function isWithinRange(candidate, rangeStart, rangeEnd) {
  if (!candidate?.isValid() || !rangeStart?.isValid() || !rangeEnd?.isValid()) {
    return false
  }
  const value = candidate.valueOf()
  return value >= rangeStart.valueOf() && value < rangeEnd.valueOf()
}

function buildLinePath(values, width, height, maxValue, singlePointOffset = 0) {
  if (!Array.isArray(values) || values.length === 0) return ''
  if (maxValue <= 0) return ''
  const usableHeight = height
  const usableWidth = width
  const step = values.length > 1 ? usableWidth / (values.length - 1) : 0

  return values
    .map((value, index) => {
      const clamped = Math.max(0, value)
      const x = values.length === 1 ? singlePointOffset : index * step
      const normalized = maxValue === 0 ? 0 : clamped / maxValue
      const y = usableHeight - normalized * usableHeight
      const command = index === 0 ? 'M' : 'L'
      return `${command}${x},${y}`
    })
    .join(' ')
}

function buildAreaPath(values, width, height, maxValue, singlePointOffset = 0) {
  const linePath = buildLinePath(values, width, height, maxValue, singlePointOffset)
  if (!linePath) return ''

  const usableWidth = width
  const step = values.length > 1 ? usableWidth / (values.length - 1) : 0
  const lastX =
    values.length === 1 ? singlePointOffset : (values.length - 1) * step
  return `${linePath} L${lastX},${height} L${singlePointOffset},${height} Z`
}

function colorToRgba(hex, alpha) {
  if (typeof hex !== 'string') return `rgba(17, 17, 17, ${alpha})`
  let value = hex.replace('#', '')
  if (value.length === 3) {
    value = value
      .split('')
      .map(char => char + char)
      .join('')
  }
  const bigint = parseInt(value, 16)
  if (Number.isNaN(bigint)) return `rgba(17, 17, 17, ${alpha})`
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function HomeDashboard({
  onOpenProfile,
  currentTask,
  onSetCurrentTask,
  onCompleteTask,
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { plans, addPlan, addTask, updatePlanStatus, updateTaskStatus } = useTaskManager()
  const [activeTab, setActiveTab] = useState('tasks')
  const [selectedLongTermId, setSelectedLongTermId] = useState(() => plans[0]?.id ?? null)
  const [isAddingLongTerm, setIsAddingLongTerm] = useState(false)
  const [newLongTermTitle, setNewLongTermTitle] = useState('')
  const [newLongTermDescription, setNewLongTermDescription] = useState('')
  const [newLongTermDueDate, setNewLongTermDueDate] = useState(() =>
    dayjs().add(30, 'day').format('YYYY-MM-DD'),
  )

  const [isAddingShortTask, setIsAddingShortTask] = useState(false)
  const [newShortTaskTitle, setNewShortTaskTitle] = useState('')
  const [newShortTaskDescription, setNewShortTaskDescription] = useState('')
  const [newShortTaskCreatedAt, setNewShortTaskCreatedAt] = useState(() => dayjs().toISOString())
  const [newShortTaskStartAt, setNewShortTaskStartAt] = useState(() =>
    dayjs().format('YYYY-MM-DDTHH:mm'),
  )
  const [newShortTaskDueAt, setNewShortTaskDueAt] = useState(() =>
    dayjs().add(2, 'hour').format('YYYY-MM-DDTHH:mm'),
  )
  const [taskStatusFilter, setTaskStatusFilter] = useState('all')
  const [taskSearchQuery, setTaskSearchQuery] = useState('')
  const [progressSummaryRange, setProgressSummaryRange] = useState(
    PROGRESS_SUMMARY_RANGES[0]?.id ?? 'today',
  )
  const addPlanModalTitleId = 'dashboard-add-plan-title'
  const addTaskModalTitleId = 'dashboard-add-task-title'

  const statusLabels = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(STATUS_LABEL_KEYS).map(([status, key]) => [
          status,
          t(key, { defaultValue: STATUS_DEFAULT_LABELS[status] ?? status }),
        ]),
      ),
    [t],
  )

  const progressSummaryRanges = useMemo(
    () =>
      PROGRESS_SUMMARY_RANGES.map(range => ({
        ...range,
        label: t(range.labelKey, { defaultValue: range.defaultLabel }),
      })),
    [t],
  )

  function formatPlanCount(count) {
    const value = Number.isFinite(count) ? count : 0
    const fallback = `${value} plan${value === 1 ? '' : 's'}`
    return t('home.dashboard.longTerm.count', {
      count: value,
      defaultValue: fallback,
    })
  }

  function formatTaskCount(count) {
    const value = Number.isFinite(count) ? count : 0
    const fallback = `${value} task${value === 1 ? '' : 's'}`
    return t('home.dashboard.longTerm.taskCount', {
      count: value,
      defaultValue: fallback,
    })
  }

  function formatVisibleTaskSummary(visible, total) {
    const safeVisible = Number.isFinite(visible) ? visible : 0
    const safeTotal = Number.isFinite(total) ? total : 0
    const fallback = `Showing ${safeVisible} of ${safeTotal} task${safeTotal === 1 ? '' : 's'}`
    return t('home.dashboard.shortTerm.visibleSummary', {
      visible: safeVisible,
      total: safeTotal,
      defaultValue: fallback,
    })
  }

  useEffect(() => {
    if (plans.length === 0) {
      return
    }
    if (!selectedLongTermId || !plans.some(plan => plan.id === selectedLongTermId)) {
      setSelectedLongTermId(plans[0]?.id ?? null)
    }
  }, [plans, selectedLongTermId])

  useEffect(() => {
    if (!newShortTaskStartAt || !newShortTaskDueAt) {
      return
    }
    const start = dayjs(newShortTaskStartAt)
    const due = dayjs(newShortTaskDueAt)
    if (!start.isValid()) {
      return
    }
    if (!due.isValid() || due.isBefore(start)) {
      setNewShortTaskDueAt(start.add(1, 'hour').format('YYYY-MM-DDTHH:mm'))
    }
  }, [newShortTaskStartAt, newShortTaskDueAt])

  const newShortTaskCreatedDisplay = useMemo(() => {
    const created = newShortTaskCreatedAt ? dayjs(newShortTaskCreatedAt) : null
    return created?.isValid() ? created.format('MMMM D, YYYY h:mm A') : ''
  }, [newShortTaskCreatedAt])

  function resetShortTaskForm() {
    const now = dayjs()
    setNewShortTaskTitle('')
    setNewShortTaskDescription('')
    setNewShortTaskCreatedAt(now.toISOString())
    const startValue = now.format('YYYY-MM-DDTHH:mm')
    const dueValue = now.add(2, 'hour').format('YYYY-MM-DDTHH:mm')
    setNewShortTaskStartAt(startValue)
    setNewShortTaskDueAt(dueValue)
  }

  function closeAddLongTerm() {
    setIsAddingLongTerm(false)
    setNewLongTermTitle('')
    setNewLongTermDescription('')
    setNewLongTermDueDate(dayjs().add(30, 'day').format('YYYY-MM-DD'))
  }

  function handleOpenAddLongTerm() {
    closeAddShortTask()
    setNewLongTermTitle('')
    setNewLongTermDescription('')
    setNewLongTermDueDate(dayjs().add(30, 'day').format('YYYY-MM-DD'))
    setIsAddingLongTerm(true)
  }

  function closeAddShortTask() {
    setIsAddingShortTask(false)
    resetShortTaskForm()
  }

  function handleOpenAddShortTask() {
    if (!selectedLongTermId) return
    closeAddLongTerm()
    resetShortTaskForm()
    setIsAddingShortTask(true)
  }

  function handleOpenFlowView() {
    if (!selectedLongTermId) return
    navigate(`/plans/${selectedLongTermId}/flow`)
  }

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        if (isAddingShortTask) {
          closeAddShortTask()
        } else if (isAddingLongTerm) {
          closeAddLongTerm()
        }
      }
    }

    if (isAddingLongTerm || isAddingShortTask) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }

    return undefined
  }, [isAddingLongTerm, isAddingShortTask])

  const progressEntries = useMemo(() => {
    if (!Array.isArray(plans)) {
      return []
    }

    const variantLookup = new Map()
    plans.forEach((plan, index) => {
      const variant =
        PROGRESS_TAG_VARIANTS[index % PROGRESS_TAG_VARIANTS.length] ?? PROGRESS_TAG_VARIANTS[0]
      variantLookup.set(plan.id, variant)
    })

    const records = plans.flatMap(plan => {
      const planVariant = variantLookup.get(plan.id) ?? PROGRESS_TAG_VARIANTS[0]
      return (plan.tasks ?? []).map(task => {
        const created = task.createdAt ? dayjs(task.createdAt) : null
        const started = task.startAt ? dayjs(task.startAt) : created
        const completed = task.completedAt ? dayjs(task.completedAt) : null
        const hasCreated = created?.isValid() ?? false
        const hasStarted = started?.isValid() ?? false
        const hasCompleted = completed?.isValid() ?? false
        const start = hasStarted ? started.format('MMMM D, YYYY h:mm A') : '—'
        const finish = hasCompleted ? completed.format('MMMM D, YYYY h:mm A') : '—'
        const manualMinutes =
          typeof task.trackedMinutes === 'number' && task.trackedMinutes >= 0
            ? Math.round(task.trackedMinutes)
            : 0
        const minutes = manualMinutes
        const referenceMoment = hasCompleted
          ? completed
          : hasStarted
            ? started
            : hasCreated
              ? created
              : null
        const referenceDate = referenceMoment?.isValid() ? referenceMoment.toISOString() : null
        const planRef = {
          id: plan.id,
          title: plan.title,
          description: plan.description ?? '',
          status: plan.status ?? 'not-started',
        }
        const taskRef = {
          id: task.id,
          title: task.title,
          description: task.description ?? '',
          status: task.status ?? 'not-started',
          createdAt: task.createdAt ?? null,
          startAt: task.startAt ?? null,
          completedAt: task.completedAt ?? null,
          dueDate: task.dueDate ?? null,
          trackedMinutes: manualMinutes,
        }
        return {
          id: `progress-${task.id}`,
          name: task.title,
          tag: { label: plan.title, variant: planVariant },
          start,
          finish,
          minutes,
          planRef,
          taskRef,
          planId: plan.id,
          taskId: task.id,
          createdSortKey: hasStarted
            ? started.valueOf()
            : hasCreated
            ? created.valueOf()
            : 0,
          startDate: hasStarted ? started.toISOString() : null,
          finishDate: hasCompleted ? completed.toISOString() : null,
          referenceDate,
        }
      })
    })

    return records.sort((a, b) => b.createdSortKey - a.createdSortKey)
  }, [plans])

  const progressSegments = useMemo(() => {
    if (progressEntries.length === 0) {
      return []
    }

    const now = dayjs()
    const { weekStart, weekEnd } = getWeekWindow(now)
    const matchesRange = reference => {
      if (!reference) return false
      const moment = dayjs(reference)
      if (!moment.isValid()) return false
      if (progressSummaryRange === 'today') {
        return moment.isSame(now, 'day')
      }
      return isWithinRange(moment, weekStart, weekEnd)
    }

    const grouped = new Map()
    progressEntries.forEach(entry => {
      const minutes = Number(entry.minutes) || 0
      if (minutes <= 0) return
      if (!matchesRange(entry.referenceDate)) return

      const key = entry.tag.label
      const existing = grouped.get(key)
      if (existing) {
        existing.minutes += minutes
      } else {
        grouped.set(key, {
          id: `segment-${key.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          label: entry.tag.label,
          minutes,
          color: PROGRESS_SEGMENT_COLORS[entry.tag.variant] ?? PROGRESS_SEGMENT_COLORS.indigo,
        })
      }
    })

    return Array.from(grouped.values()).map(segment => ({
      ...segment,
      hours: Number((segment.minutes / 60).toFixed(2)),
    }))
  }, [progressEntries, progressSummaryRange])

  const progressLineData = useMemo(() => {
    const monthSet = new Set()
    const seriesMap = new Map()

    const addEntry = (label, variant, monthKey, minutes) => {
      if (!monthKey) return
      monthSet.add(monthKey)
      const color = PROGRESS_SEGMENT_COLORS[variant] ?? PROGRESS_SEGMENT_COLORS.indigo
      let series = seriesMap.get(label)
      if (!series) {
        series = { label, color, variant, data: new Map() }
        seriesMap.set(label, series)
      }
      const existingMinutes = series.data.get(monthKey) ?? 0
      series.data.set(monthKey, existingMinutes + minutes)
    }

    progressEntries.forEach(entry => {
      const referenceDate = entry.finishDate ?? entry.startDate
      if (!referenceDate) return
      const monthKey = getMonthKey(referenceDate)
      if (!monthKey) return
      addEntry(entry.tag.label, entry.tag.variant, monthKey, Number(entry.minutes) || 0)
    })

    if (monthSet.size === 0) {
      const demoMonths = [
        dayjs().subtract(4, 'month').startOf('month'),
        dayjs().subtract(3, 'month').startOf('month'),
        dayjs().subtract(2, 'month').startOf('month'),
        dayjs().subtract(1, 'month').startOf('month'),
        dayjs().startOf('month'),
      ]
      const demoPlans = [
        {
          label: t('home.dashboard.demoPlans.capstone', { defaultValue: 'Capstone Project' }),
          variant: 'teal',
          values: [420, 520, 600, 720, 810],
        },
        {
          label: t('home.dashboard.demoPlans.language', { defaultValue: 'Language Sprint' }),
          variant: 'stone',
          values: [180, 220, 280, 315, 360],
        },
        {
          label: t('home.dashboard.demoPlans.foundations', { defaultValue: 'Foundations Refresh' }),
          variant: 'violet',
          values: [240, 260, 320, 280, 360],
        },
      ]

      demoMonths.forEach(month => monthSet.add(month.format('YYYY-MM')))
      demoPlans.forEach(plan => {
        plan.values.forEach((minutes, index) => {
          const monthKey = demoMonths[index].format('YYYY-MM')
          addEntry(plan.label, plan.variant, monthKey, minutes)
        })
      })
    }

    const monthKeys = Array.from(monthSet).sort()
    const labels = monthKeys.map(formatMonthLabel)

    const series = Array.from(seriesMap.values()).map(seriesEntry => {
      const values = monthKeys.map(key => {
        const minutes = seriesEntry.data.get(key) ?? 0
        return Number((minutes / 60).toFixed(1))
      })
      return {
        label: seriesEntry.label,
        color: seriesEntry.color,
        values,
      }
    })

    const maxValue = series.reduce((max, item) => {
      const localMax = Math.max(0, ...item.values)
      return Math.max(max, localMax)
    }, 0)

    return { labels, monthKeys, series, maxValue }
  }, [progressEntries])

  const summaryTotalMinutes = useMemo(
    () => progressSegments.reduce((sum, segment) => sum + (Number(segment.minutes) || 0), 0),
    [progressSegments],
  )

  const formattedTrackedHours =
    summaryTotalMinutes > 0 ? (summaryTotalMinutes / 60).toFixed(2) : '0.00'

  const progressChart = useMemo(() => {
    if (summaryTotalMinutes <= 0) {
      return { gradient: 'conic-gradient(#e5e7eb 0deg 360deg)' }
    }

    let currentAngle = 0
    const stops = progressSegments.map(segment => {
      const slice = (segment.minutes / summaryTotalMinutes) * 360
      const start = currentAngle
      const end = currentAngle + slice
      currentAngle = end
      return `${segment.color} ${start}deg ${end}deg`
    })

    return {
      gradient: `conic-gradient(${stops.join(', ')})`,
    }
  }, [progressSegments, summaryTotalMinutes])

  const summaryMinutes = useMemo(() => {
    const now = dayjs()
    const { weekStart, weekEnd } = getWeekWindow(now)
    const lastWeekStart = weekStart.subtract(7, 'day')
    const lastWeekEnd = weekStart
    return progressEntries.reduce(
      (acc, entry) => {
        const minutes = Number(entry.minutes) || 0
        if (minutes <= 0 || !entry.referenceDate) {
          return acc
        }
        const reference = dayjs(entry.referenceDate)
        if (!reference.isValid()) {
          return acc
        }
        if (reference.isSame(now, 'day')) {
          acc.today += minutes
        }
        if (isWithinRange(reference, weekStart, weekEnd)) {
          acc.week += minutes
        }
        if (isWithinRange(reference, lastWeekStart, lastWeekEnd)) {
          acc.lastWeek += minutes
        }
        return acc
      },
      { today: 0, week: 0, lastWeek: 0 },
    )
  }, [progressEntries])

  const weekComparison = useMemo(() => {
    const current = summaryMinutes.week
    const previous = summaryMinutes.lastWeek
    const diff = current - previous
    let percent = 0
    if (previous === 0) {
      percent = current > 0 ? 100 : 0
    } else {
      percent = (diff / previous) * 100
    }
    return {
      current,
      previous,
      diff,
      percent,
    }
  }, [summaryMinutes])

  const weekTrendPercent = Number.isFinite(weekComparison.percent)
    ? Math.abs(weekComparison.percent).toFixed(0)
    : '0'
  const weekTrendSign =
    weekComparison.percent > 0 ? '+' : weekComparison.percent < 0 ? '-' : ''

  const selectedLongTerm = useMemo(
    () => plans.find(item => item.id === selectedLongTermId) ?? null,
    [plans, selectedLongTermId],
  )

  const filteredTasks = useMemo(() => {
    if (!selectedLongTerm) return []
    const normalizedQuery = taskSearchQuery.trim().toLowerCase()
    return selectedLongTerm.tasks.filter(task => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        task.title.toLowerCase().includes(normalizedQuery) ||
        (task.description && task.description.toLowerCase().includes(normalizedQuery))
      const matchesStatus = taskStatusFilter === 'all' ? true : task.status === taskStatusFilter
      return matchesSearch && matchesStatus
    })
  }, [selectedLongTerm, taskSearchQuery, taskStatusFilter])

  function handleSelectLongTerm(id) {
    setSelectedLongTermId(id)
    closeAddShortTask()
    setTaskStatusFilter('all')
    setTaskSearchQuery('')
  }

  async function handleAddLongTerm(event) {
    event.preventDefault()
    const title = newLongTermTitle.trim()
    if (!title) return

    try {
      const plan = await addPlan({
        title,
        description: newLongTermDescription.trim(),
        dueDate: newLongTermDueDate || null,
      })
      if (plan?.id) {
        setSelectedLongTermId(plan.id)
      }
      closeAddLongTerm()
    } catch (error) {
      console.error('Failed to create task plan', error)
    }
  }

  async function handleAddShortTask(event) {
    event.preventDefault()
    if (!selectedLongTerm) return

    const title = newShortTaskTitle.trim()
    if (!title) return
    const description = newShortTaskDescription.trim()
    const createdAt = newShortTaskCreatedAt || dayjs().toISOString()
    const parsedStart = newShortTaskStartAt ? dayjs(newShortTaskStartAt) : null
    const startAt =
      parsedStart && parsedStart.isValid() ? parsedStart.toISOString() : createdAt
    const parsedDue = newShortTaskDueAt ? dayjs(newShortTaskDueAt) : null
    let dueDate =
      parsedDue && parsedDue.isValid() ? parsedDue.toISOString() : startAt
    if (dueDate && startAt && dayjs(dueDate).isBefore(dayjs(startAt))) {
      dueDate = startAt
    }

    try {
      await addTask(selectedLongTerm.id, {
        title,
        description,
        createdAt,
        startAt,
        dueDate,
      })
      closeAddShortTask()
    } catch (error) {
      console.error('Failed to add task', error)
    }
  }

  async function handleLongTermStatusChange(longTermId, status) {
    try {
      await updatePlanStatus(longTermId, status)
    } catch (error) {
      console.error('Failed to update plan status', error)
    }
  }

  async function handleTaskStatusChange(taskId, status) {
    if (!selectedLongTerm) return
    try {
      const result = await updateTaskStatus(selectedLongTerm.id, taskId, status)
      const nextTask = result?.nextTask ?? null
      if (!nextTask) return

      if (status === 'in-progress' && typeof onSetCurrentTask === 'function') {
        onSetCurrentTask(nextTask.title)
      }

      if (status === 'completed' && typeof onCompleteTask === 'function') {
        onCompleteTask(nextTask.title)
      }
    } catch (error) {
      console.error('Failed to update task status', error)
    }
  }

  function handleOpenTaskDetail(plan, task) {
    if (!plan || !task) return
    navigate(`/tasks/${task.id}`, {
      state: {
        plan: {
          id: plan.id,
          title: plan.title,
          description: plan.description ?? '',
          status: plan.status,
        },
        task: {
          id: task.id,
          title: task.title,
          description: task.description ?? '',
          status: task.status,
          createdAt: task.createdAt ?? null,
          startAt: task.startAt ?? null,
          completedAt: task.completedAt ?? null,
        },
      },
    })
  }

  function openProgressEntry(entry) {
    if (!entry?.planRef || !entry?.taskRef) return
    handleOpenTaskDetail(entry.planRef, entry.taskRef)
  }

  function handleProgressRowKey(event, entry) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openProgressEntry(entry)
    }
  }

  const longTermCount = plans.length
  const shortTaskCount = selectedLongTerm?.tasks.length ?? 0
  const visibleTaskCount = filteredTasks.length
  const isTaskModalOpen = Boolean(isAddingShortTask && selectedLongTerm)
  const selectedPlanStatusId = selectedLongTerm
    ? `plan-status-${selectedLongTerm.id}`
    : 'plan-status-select'
  const selectedPlanStatus = selectedLongTerm?.status ?? 'not-started'
  const trendChartDimensions = { width: 720, height: 260 }
  const trendChartMargins = { top: 28, right: 32, bottom: 44, left: 60 }
  const trendInnerWidth =
    trendChartDimensions.width - trendChartMargins.left - trendChartMargins.right
  const trendInnerHeight =
    trendChartDimensions.height - trendChartMargins.top - trendChartMargins.bottom
  const trendTickCount = 4
  const trendSafeMax = progressLineData.maxValue > 0 ? Math.ceil(progressLineData.maxValue) : 1
  const trendYTicks = Array.from({ length: trendTickCount + 1 }, (_, index) =>
    Number(((trendSafeMax / trendTickCount) * index).toFixed(1)),
  )
  const trendStep =
    progressLineData.labels.length > 1
      ? trendInnerWidth / (progressLineData.labels.length - 1)
      : 0
  const trendSinglePointOffset =
    progressLineData.labels.length === 1 ? trendInnerWidth / 2 : 0

  return (
    <div className="main-dashboard">
      <div className="main-dashboard__topbar">
        <div
          className="main-dashboard__tabs"
          role="tablist"
          aria-label={t('home.dashboard.tabs.aria', { defaultValue: 'Dashboard sections' })}
        >
          <button
            type="button"
            className={`main-dashboard__tab${activeTab === 'tasks' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('tasks')}
            role="tab"
            aria-selected={activeTab === 'tasks'}
          >
            {t('home.dashboard.tabs.tasks', { defaultValue: 'Tasks' })}
          </button>
          <button
            type="button"
            className={`main-dashboard__tab${activeTab === 'progress' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('progress')}
            role="tab"
            aria-selected={activeTab === 'progress'}
          >
            {t('home.dashboard.tabs.progress', { defaultValue: 'Progress' })}
          </button>
        </div>

        {typeof onOpenProfile === 'function' && (
          <div className="main-dashboard__profile-action">
            <span className="main-dashboard__profile-hint">
              {t('home.dashboard.profile.tagline', { defaultValue: 'See your full study story' })}
            </span>
            <button
              type="button"
              className="btn ghost main-dashboard__profile-btn"
              onClick={onOpenProfile}
            >
              {t('home.dashboard.profile.view', { defaultValue: 'View profile' })}
            </button>
          </div>
        )}
      </div>

      <section className="main-dashboard__panels">
        {activeTab === 'tasks' ? (
          <div className="task-panel">
            <div className="task-panel__column task-panel__column--overview">
              <div className="task-panel__header long-term-panel__header">
                <div className="long-term-panel__summary">
                  <div className="long-term-panel__title-row">
                    <h2 className="task-panel__title">
                      {t('home.dashboard.longTerm.title', { defaultValue: 'Long-term focus' })}
                    </h2>
                    <span className="task-panel__meta task-panel__meta--inline">
                      {formatPlanCount(longTermCount)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn cat-primary task-panel__add-plan-btn long-term-panel__cta"
                onClick={handleOpenAddLongTerm}
              >
                {t('home.dashboard.longTerm.add', { defaultValue: 'Add plan' })}
              </button>
              <p className="long-term-panel__hint">
                {t('home.dashboard.longTerm.subtitle', {
                  defaultValue: 'Map the ambitions that matter most and return here to adjust your path.',
                })}
              </p>

              <ul className="long-term-list">
                {plans.map(group => {
                  const isActive = group.id === selectedLongTermId
                  const currentStatus = group.status ?? 'not-started'
                  const statusClass = `status-${currentStatus}`
                  return (
                    <li key={group.id}>
                      <div
                        className={`long-term-list__item ${statusClass}${
                          isActive ? ' is-active' : ''
                        }`.trim()}
                      >
                        <button
                          type="button"
                          className="long-term-list__trigger"
                          onClick={() => handleSelectLongTerm(group.id)}
                        >
                          <span className="long-term-list__title">{group.title}</span>
                          <span className="long-term-list__count">{formatTaskCount(group.tasks.length)}</span>
                          {group.description && (
                            <span className="long-term-list__description">{group.description}</span>
                          )}
                        </button>
                          <span className={`long-term-list__status status-${currentStatus}`}>
                          {statusLabels[currentStatus] ?? statusLabels['not-started']}
                        </span>
                      </div>
                    </li>
                  )
                })}
                {plans.length === 0 && (
                  <li className="long-term-list__empty">
                    {t('home.dashboard.longTerm.empty', {
                      defaultValue: 'Add a plan to begin tracking your long-term goals.',
                    })}
                  </li>
                )}
              </ul>
            </div>

            <div className="task-panel__column task-panel__column--primary">
              <div className="task-panel__header">
                <div>
                  <h2 className="task-panel__title">
                    {selectedLongTerm
                      ? selectedLongTerm.title
                      : t('home.dashboard.shortTerm.placeholderTitle', { defaultValue: 'Choose a plan' })}
                  </h2>
                  <p className="task-panel__meta">
                    {selectedLongTerm
                      ? formatVisibleTaskSummary(visibleTaskCount, shortTaskCount)
                      : t('home.dashboard.shortTerm.selectPrompt', {
                          defaultValue: 'Select a plan to view its tasks.',
                        })}
                  </p>
                </div>
                <div className="task-panel__actions">
                  <button
                    type="button"
                    className="btn ghost task-panel__flow-button"
                    disabled={!selectedLongTerm}
                    onClick={handleOpenFlowView}
                  >
                    {t('home.dashboard.shortTerm.flowView', { defaultValue: 'Flow view (フロー表示)' })}
                  </button>
                  <button
                    type="button"
                    className="btn task-panel__add-task-btn"
                    disabled={!selectedLongTerm}
                    onClick={handleOpenAddShortTask}
                  >
                    {t('home.dashboard.shortTerm.add', { defaultValue: 'Add task' })}
                  </button>
                </div>
              </div>

              {selectedLongTerm && (
                <div className="task-panel__plan-bar">
                  <p
                    className={`task-panel__plan-summary${
                      selectedLongTerm.description ? '' : ' is-empty'
                    }`}
                  >
                    {selectedLongTerm.description ||
                      t('home.dashboard.shortTerm.noteFallback', {
                        defaultValue: 'Add a quick note to keep the focus of this plan clear.',
                      })}
                  </p>
                  <div className="task-panel__plan-controls">
                    <label className="task-panel__filters-label" htmlFor={selectedPlanStatusId}>
                      {t('home.dashboard.shortTerm.statusLabel', { defaultValue: 'Plan status' })}
                    </label>
                    <select
                      id={selectedPlanStatusId}
                      className="status-select plan-status-select"
                      value={selectedPlanStatus}
                      onChange={event =>
                        handleLongTermStatusChange(selectedLongTerm.id, event.target.value)
                      }
                    >
                      {LONG_TERM_STATUS_OPTIONS.map(option => (
                        <option key={option} value={option}>
                          {statusLabels[option]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {selectedLongTerm && selectedLongTerm.tasks.length > 0 && (
                <div
                  className="task-panel__filters"
                  role="group"
                  aria-label={t('home.dashboard.shortTerm.filtersAria', { defaultValue: 'Task filters' })}
                >
                  <div className="task-panel__search">
                    <label className="task-panel__filters-label" htmlFor="task-search-input">
                      {t('home.dashboard.shortTerm.searchLabel', { defaultValue: 'Search' })}
                    </label>
                    <input
                      id="task-search-input"
                      className="input"
                      type="search"
                      placeholder={t('home.dashboard.shortTerm.searchPlaceholder', {
                        defaultValue: 'Find a task...',
                      })}
                      value={taskSearchQuery}
                      onChange={event => setTaskSearchQuery(event.target.value)}
                    />
                  </div>
                  <div className="task-panel__filter">
                    <label className="task-panel__filters-label" htmlFor="task-status-filter">
                      {t('home.dashboard.shortTerm.statusFilterLabel', { defaultValue: 'Status' })}
                    </label>
                    <select
                      id="task-status-filter"
                      className="status-select"
                      value={taskStatusFilter}
                      onChange={event => setTaskStatusFilter(event.target.value)}
                    >
                      <option value="all">
                        {t('home.dashboard.shortTerm.allStatuses', { defaultValue: 'All statuses' })}
                      </option>
                      {TASK_STATUS_OPTIONS.map(option => (
                        <option key={option} value={option}>
                          {statusLabels[option]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {selectedLongTerm ? (
                selectedLongTerm.tasks.length === 0 ? (
                  <div className="task-panel__empty">
                    {t('home.dashboard.shortTerm.empty', {
                      defaultValue: 'No tasks yet. Add one to start making progress.',
                    })}
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="task-panel__empty">
                    {t('home.dashboard.shortTerm.noMatches', {
                      defaultValue: 'No tasks match your filters. Adjust or clear them to see more tasks.',
                    })}
                  </div>
                ) : (
                  <div className="task-card-grid">
                    {filteredTasks.map(task => {
                      const isCurrent =
                        currentTask?.title === task.title && task.status === 'in-progress'
                      const selectId = `task-status-${task.id}`
                      const statusLabelClass = `task-card__status-label status-${task.status}`
                      return (
                        <article
                          key={task.id}
                          className={`task-card task-card--${task.status}${
                            isCurrent ? ' is-current' : ''
                          }`}
                          role="button"
                          tabIndex={0}
                          aria-label={t('home.dashboard.shortTerm.openTask', {
                            title: task.title,
                            defaultValue: `Open task ${task.title}`,
                          })}
                          onClick={() => handleOpenTaskDetail(selectedLongTerm, task)}
                          onKeyDown={event => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              handleOpenTaskDetail(selectedLongTerm, task)
                            }
                          }}
                        >
                          <header className="task-card__header">
                            <span className={statusLabelClass}>
                              {statusLabels[task.status] ?? statusLabels['not-started']}
                            </span>
                            {isCurrent && (
                              <span className="task-card__badge">
                                {t('home.dashboard.shortTerm.inFocus', { defaultValue: 'In focus' })}
                              </span>
                            )}
                          </header>
                          <h3 className="task-card__title">{task.title}</h3>
                          {task.description && (
                            <p className="task-card__description">{task.description}</p>
                          )}
                          <footer className="task-card__footer">
                            <label className="task-card__footer-label" htmlFor={selectId}>
                              {t('home.dashboard.shortTerm.statusFieldLabel', { defaultValue: 'Status' })}
                            </label>
                            <select
                              id={selectId}
                              className="status-select task-card__status-select"
                              value={task.status}
                              onClick={event => event.stopPropagation()}
                              onKeyDown={event => event.stopPropagation()}
                              onChange={event => {
                                event.stopPropagation()
                                handleTaskStatusChange(task.id, event.target.value)
                              }}
                            >
                              {TASK_STATUS_OPTIONS.map(option => (
                                <option key={option} value={option}>
                                  {statusLabels[option]}
                                </option>
                              ))}
                            </select>
                          </footer>
                        </article>
                      )
                    })}
                  </div>
                )
              ) : (
                <div className="task-panel__empty">
                  {t('home.dashboard.shortTerm.noSelection', {
                    defaultValue: 'Select a long-term focus on the left to view its tasks.',
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            className="progress-panel"
            aria-label={t('home.dashboard.progress.panelAria', { defaultValue: 'Progress tab' })}
          >
            <div className="progress-panel__main">
              <h2 className="progress-panel__title">
                {t('home.dashboard.progress.title', { defaultValue: 'Focus Time Tracker Database' })}
              </h2>

              <div
                className="progress-table"
                role="table"
                aria-label={t('home.dashboard.progress.tableAria', {
                  defaultValue: 'Focus time entries',
                })}
              >
                <div className="progress-table__header" role="row">
                  <span
                    className="progress-table__cell progress-table__cell--head"
                    role="columnheader"
                  >
                    {t('home.dashboard.progress.tableHeaders.task', { defaultValue: 'Task' })}
                  </span>
                  <span
                    className="progress-table__cell progress-table__cell--head"
                    role="columnheader"
                  >
                    {t('home.dashboard.progress.tableHeaders.plan', { defaultValue: 'Plan' })}
                  </span>
                  <span
                    className="progress-table__cell progress-table__cell--head progress-table__cell--meta"
                    role="columnheader"
                  >
                    {t('home.dashboard.progress.tableHeaders.minutes', {
                      defaultValue: 'Minutes',
                    })}
                  </span>
                </div>

                <div className="progress-table__body">
                  {progressEntries.length > 0 ? (
                    progressEntries.map(entry => (
                      <div
                        key={entry.id}
                        className="progress-table__row is-clickable"
                        role="row"
                        tabIndex={0}
                        aria-label={t('home.dashboard.progress.openTask', {
                          defaultValue: 'Open task details',
                        })}
                        onClick={() => openProgressEntry(entry)}
                        onKeyDown={event => handleProgressRowKey(event, entry)}
                      >
                        <span
                          className="progress-table__cell progress-table__cell--name"
                          role="cell"
                        >
                          <span className="progress-table__mention" aria-hidden="true">
                            @
                          </span>
                          <span className="progress-table__name-text">{entry.name}</span>
                        </span>
                        <span className="progress-table__cell" role="cell">
                          <span className={`progress-tag progress-tag--${entry.tag.variant}`}>
                            {entry.tag.label}
                          </span>
                        </span>
                        <span
                          className="progress-table__cell progress-table__cell--meta"
                          role="cell"
                        >
                          {entry.minutes ?? 0}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="progress-table__empty" role="row" aria-live="polite">
                      {t('home.dashboard.progress.empty', {
                        defaultValue: 'No short-term tasks have been logged yet.',
                      })}
                    </div>
                  )}
                </div>
              </div>

              <section
                className="progress-trends"
                aria-label={t('home.dashboard.progress.trendsAria', {
                  defaultValue: 'Plan progress trends',
                })}
              >
                <header className="progress-trends__header">
                  <span className="progress-trends__badge" aria-hidden="true">
                    {t('home.dashboard.progress.badge', { defaultValue: 'Study Time' })}
                  </span>
                  <span className="progress-trends__range">
                    {t('home.dashboard.progress.rangeLabel', { defaultValue: 'Monthly totals' })}
                  </span>
                </header>

                {progressLineData.series.length > 0 ? (
                  <div className="progress-trends__chart">
                    <svg
                      className="progress-line-chart"
                      viewBox={`0 0 ${trendChartDimensions.width} ${trendChartDimensions.height}`}
                      role="img"
                      aria-label={t('home.dashboard.progress.chartAria', {
                        defaultValue: 'Tracked hours per plan over time',
                      })}
                    >
                      <rect
                        className="progress-line-chart__background"
                        x="0"
                        y="0"
                        width={trendChartDimensions.width}
                        height={trendChartDimensions.height}
                        rx="18"
                      />

                      <g
                        className="progress-line-chart__grid"
                        transform={`translate(${trendChartMargins.left}, ${trendChartMargins.top})`}
                      >
                        {trendYTicks.map((tick, index) => {
                          const y =
                            trendInnerHeight -
                            (trendSafeMax === 0 ? 0 : (tick / trendSafeMax) * trendInnerHeight)
                          return (
                            <g key={`y-${index}`}>
                              <line
                                x1={0}
                                x2={trendInnerWidth}
                                y1={y}
                                y2={y}
                                className="progress-line-chart__grid-line"
                              />
                              <text
                                className="progress-line-chart__y-label"
                                x={-12}
                                y={y}
                                dominantBaseline="middle"
                                textAnchor="end"
                              >
                                {tick.toFixed(1)}h
                              </text>
                            </g>
                          )
                        })}
                      </g>

                      <g
                        className="progress-line-chart__series"
                        transform={`translate(${trendChartMargins.left}, ${trendChartMargins.top})`}
                      >
                        {progressLineData.series.map(series => {
                          const path = buildLinePath(
                            series.values,
                            trendInnerWidth,
                            trendInnerHeight,
                            trendSafeMax,
                            trendSinglePointOffset,
                          )
                          const areaPath = buildAreaPath(
                            series.values,
                            trendInnerWidth,
                            trendInnerHeight,
                            trendSafeMax,
                            trendSinglePointOffset,
                          )
                          return (
                            <g key={series.label} className="progress-line-chart__series-group">
                              <path
                                d={areaPath}
                                className="progress-line-chart__area"
                                fill={colorToRgba(series.color, 0.18)}
                              />
                              <path
                                d={path}
                                fill="none"
                                stroke={series.color}
                                strokeWidth="1.75"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              {series.values.map((value, index) => {
                                const x =
                                  progressLineData.labels.length === 1
                                    ? trendSinglePointOffset
                                    : index * trendStep
                                const normalized =
                                  trendSafeMax === 0 ? 0 : Math.max(0, value) / trendSafeMax
                                const y = trendInnerHeight - normalized * trendInnerHeight
                                return (
                                  <circle
                                    key={`${series.label}-pt-${index}`}
                                    cx={x}
                                    cy={y}
                                    r="4"
                                    fill="#ffffff"
                                    stroke={series.color}
                                    strokeWidth="1.6"
                                  >
                                    <title>
                                      {series.label}: {value.toFixed(1)}h · {progressLineData.labels[index]}
                                    </title>
                                  </circle>
                                )
                              })}
                              {series.values.map((value, index) => {
                                const x =
                                  progressLineData.labels.length === 1
                                    ? trendSinglePointOffset
                                    : index * trendStep
                                const normalized =
                                  trendSafeMax === 0 ? 0 : Math.max(0, value) / trendSafeMax
                                const y = trendInnerHeight - normalized * trendInnerHeight
                                const labelY = Math.min(
                                  trendInnerHeight - 12,
                                  Math.max(14, y - 16),
                                )
                                return (
                                  <text
                                    key={`${series.label}-label-${index}`}
                                    x={x}
                                    y={labelY}
                                    className="progress-line-chart__point-label"
                                    textAnchor="middle"
                                  >
                                    {value.toFixed(1)}h
                                  </text>
                                )
                              })}
                            </g>
                          )
                        })}
                      </g>

                      <g
                        className="progress-line-chart__x-axis"
                        transform={`translate(${trendChartMargins.left}, ${
                          trendChartDimensions.height - trendChartMargins.bottom + 12
                        })`}
                      >
                        {progressLineData.labels.map((label, index) => {
                          const x =
                            progressLineData.labels.length === 1
                              ? trendSinglePointOffset
                              : index * trendStep
                          return (
                            <text
                              key={label}
                              x={x}
                              className="progress-line-chart__x-label"
                              textAnchor={
                                index === 0
                                  ? 'start'
                                  : index === progressLineData.labels.length - 1
                                  ? 'end'
                                  : 'middle'
                              }
                            >
                              {label}
                            </text>
                          )
                        })}
                      </g>
                    </svg>

                    <ul className="progress-trends__legend">
                      {progressLineData.series.map(series => (
                        <li key={series.label}>
                          <span
                            className="progress-trends__legend-swatch"
                            style={{ backgroundColor: series.color }}
                          />
                          <span className="progress-trends__legend-label">{series.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="progress-trends__empty">
                    {t('home.dashboard.progress.noTrends', {
                      defaultValue: 'Add tasks to see timeline insights.',
                    })}
                  </div>
                )}
              </section>
            </div>

            <aside
              className="progress-summary"
              aria-label={t('home.dashboard.progress.summaryAria', {
                defaultValue: 'Tracked time summary',
              })}
            >
              <div
                className="progress-summary__tabs"
                role="tablist"
                aria-label={t('home.dashboard.progress.summaryRangeAria', {
                  defaultValue: 'Summary range',
                })}
              >
                {progressSummaryRanges.map(range => {
                  const isActive = progressSummaryRange === range.id
                  return (
                    <button
                      key={range.id}
                      type="button"
                      className={`progress-summary__tab${isActive ? ' is-active' : ''}`}
                      onClick={() => setProgressSummaryRange(range.id)}
                      role="tab"
                      aria-selected={isActive}
                    >
                      {range.label}
                    </button>
                  )
                })}
              </div>

              <div className="progress-donut">
                <div
                  className="progress-donut__ring"
                  style={{ background: progressChart.gradient }}
                  aria-hidden="true"
                >
                  <div className="progress-donut__center">
                    <span className="progress-donut__value">{formattedTrackedHours}</span>
                    <span className="progress-donut__label">
                      {t('home.dashboard.progress.totalHoursLabel', { defaultValue: 'Total H' })}
                    </span>
                  </div>
                </div>

                <ul className="progress-legend">
                  {progressSegments.length > 0 ? (
                    progressSegments.map(segment => (
                      <li key={segment.id} className="progress-legend__item">
                        <span
                          className="progress-legend__swatch"
                          style={{ backgroundColor: segment.color }}
                          aria-hidden="true"
                        />
                        <span
                          className="progress-legend__text"
                          style={{ color: segment.color }}
                        >
                          {segment.label}
                        </span>
                        <span
                          className="progress-legend__hours"
                          style={{ color: segment.color }}
                        >
                          {segment.hours.toFixed(2)}h
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="progress-legend__item is-empty">
                      {t('home.dashboard.progress.noSegments', {
                        defaultValue: 'Track time to see a breakdown.',
                      })}
                    </li>
                  )}
                </ul>

                <div className="progress-summary__comparison" aria-live="polite">
                  <p className="progress-summary__comparison-title">
                    {t('home.dashboard.progress.weekComparisonTitle', {
                      defaultValue: 'This week vs last week',
                    })}
                  </p>
                  <div
                    className={`progress-summary__comparison-value${
                      weekComparison.diff >= 0 ? ' is-up' : ' is-down'
                    }`}
                  >
                    {weekTrendSign}
                    {weekTrendPercent}%
                  </div>
                  <p className="progress-summary__comparison-note">
                    {weekComparison.diff >= 0
                      ? t('home.dashboard.progress.weekComparisonPositive', {
                          defaultValue: '{{minutes}} min more focus time',
                          minutes: weekComparison.diff,
                        })
                      : t('home.dashboard.progress.weekComparisonNegative', {
                          defaultValue: '{{minutes}} min less focus time',
                          minutes: Math.abs(weekComparison.diff),
                        })}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </section>

      <div className="cat-peek-spot">
        <CatPeekAnimation size={160} />
      </div>

      {isAddingLongTerm && (
        <div
          className="dashboard-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby={addPlanModalTitleId}
          onClick={closeAddLongTerm}
        >
          <div
            className="dashboard-modal__dialog"
            role="document"
            onClick={event => event.stopPropagation()}
          >
            <header className="dashboard-modal__header">
              <h2 className="dashboard-modal__title" id={addPlanModalTitleId}>
                {t('home.dashboard.longTerm.modal.title', { defaultValue: 'Add plan' })}
              </h2>
              <button
                type="button"
                className="dashboard-modal__close"
                aria-label={t('home.dashboard.longTerm.modal.close', {
                  defaultValue: 'Close add plan dialog',
                })}
                onClick={closeAddLongTerm}
              >
                &times;
              </button>
            </header>
            <form className="dashboard-modal__form" onSubmit={handleAddLongTerm}>
              <label className="task-panel__label" htmlFor="new-long-term-title">
                {t('home.dashboard.longTerm.modal.nameLabel', { defaultValue: 'Plan name' })}
              </label>
              <input
                id="new-long-term-title"
                className="input"
                value={newLongTermTitle}
                onChange={event => setNewLongTermTitle(event.target.value)}
                placeholder={t('home.dashboard.longTerm.modal.namePlaceholder', {
                  defaultValue: 'e.g. Exam preparation',
                })}
                autoFocus
              />
              <label className="task-panel__label" htmlFor="new-long-term-description">
                {t('home.dashboard.longTerm.modal.summaryLabel', {
                  defaultValue: 'Summary (optional)',
                })}
              </label>
              <textarea
                id="new-long-term-description"
                className="input"
                rows={3}
                value={newLongTermDescription}
                onChange={event => setNewLongTermDescription(event.target.value)}
                placeholder={t('home.dashboard.longTerm.modal.summaryPlaceholder', {
                  defaultValue: 'Add quick notes for this focus area.',
                })}
              />
              <label className="task-panel__label" htmlFor="new-long-term-due-date">
                {t('home.dashboard.longTerm.modal.dueLabel', { defaultValue: 'Due date' })}
              </label>
              <input
                id="new-long-term-due-date"
                className="input"
                type="date"
                value={newLongTermDueDate}
                onChange={event => setNewLongTermDueDate(event.target.value)}
              />
              <div className="dashboard-modal__actions">
                <button type="button" className="btn ghost" onClick={closeAddLongTerm}>
                  {t('home.dashboard.longTerm.modal.cancel', { defaultValue: 'Cancel' })}
                </button>
                <button type="submit" className="btn cat-primary">
                  {t('home.dashboard.longTerm.modal.save', { defaultValue: 'Save plan' })}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isTaskModalOpen && selectedLongTerm && (
        <div
          className="dashboard-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby={addTaskModalTitleId}
          onClick={closeAddShortTask}
        >
          <div
            className="dashboard-modal__dialog"
            role="document"
          onClick={event => event.stopPropagation()}
        >
          <header className="dashboard-modal__header">
            <h2 className="dashboard-modal__title" id={addTaskModalTitleId}>
              {t('home.dashboard.shortTerm.modal.title', { defaultValue: 'Add task' })}
            </h2>
            <p className="dashboard-modal__subtitle">
              {t('home.dashboard.shortTerm.modal.planLabel', {
                title: selectedLongTerm.title,
                defaultValue: `Plan: ${selectedLongTerm.title}`,
              })}
            </p>
            <button
              type="button"
              className="dashboard-modal__close"
              aria-label={t('home.dashboard.shortTerm.modal.close', {
                defaultValue: 'Close add task dialog',
              })}
              onClick={closeAddShortTask}
            >
              &times;
            </button>
          </header>
          <form className="dashboard-modal__form" onSubmit={handleAddShortTask}>
            <label className="task-panel__label" htmlFor="new-short-task-title">
              {t('home.dashboard.shortTerm.modal.nameLabel', { defaultValue: 'Name' })}
            </label>
            <input
              id="new-short-task-title"
              className="input"
              value={newShortTaskTitle}
              onChange={event => setNewShortTaskTitle(event.target.value)}
              placeholder={t('home.dashboard.shortTerm.modal.namePlaceholder', {
                defaultValue: 'Focus session or deliverable',
              })}
              autoFocus
            />
            <label className="task-panel__label" htmlFor="new-short-task-description">
              {t('home.dashboard.shortTerm.modal.descriptionLabel', {
                defaultValue: 'Description (optional)',
              })}
            </label>
            <textarea
              id="new-short-task-description"
              className="input"
              rows={3}
              value={newShortTaskDescription}
              onChange={event => setNewShortTaskDescription(event.target.value)}
              placeholder={t('home.dashboard.shortTerm.modal.descriptionPlaceholder', {
                defaultValue: 'Add context, resources, or checkpoints.',
              })}
            />
            <label className="task-panel__label" htmlFor="new-short-task-created">
              {t('home.dashboard.shortTerm.modal.createdLabel', { defaultValue: 'Created time' })}
            </label>
            <input
              id="new-short-task-created"
              className="input"
              type="text"
              value={newShortTaskCreatedDisplay}
              readOnly
            />
            <label className="task-panel__label" htmlFor="new-short-task-start">
              {t('home.dashboard.shortTerm.modal.startLabel', { defaultValue: 'Start time' })}
            </label>
            <input
              id="new-short-task-start"
              className="input"
              type="datetime-local"
              value={newShortTaskStartAt}
              onChange={event => setNewShortTaskStartAt(event.target.value)}
            />
            <label className="task-panel__label" htmlFor="new-short-task-due">
              {t('home.dashboard.shortTerm.modal.dueLabel', { defaultValue: 'Due time' })}
            </label>
            <input
              id="new-short-task-due"
              className="input"
              type="datetime-local"
              value={newShortTaskDueAt}
              min={newShortTaskStartAt || undefined}
              onChange={event => setNewShortTaskDueAt(event.target.value)}
            />
            <div className="dashboard-modal__actions">
              <button type="button" className="btn ghost" onClick={closeAddShortTask}>
                {t('home.dashboard.shortTerm.modal.cancel', { defaultValue: 'Cancel' })}
              </button>
              <button type="submit" className="btn cat-primary">
                {t('home.dashboard.shortTerm.modal.save', { defaultValue: 'Save task' })}
              </button>
            </div>
          </form>
        </div>
        </div>
      )}
    </div>
  )
}
