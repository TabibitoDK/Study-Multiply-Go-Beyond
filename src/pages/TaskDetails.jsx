import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { useTaskManager } from '../context/TaskManagerContext.jsx'

const TASK_STATUS_OPTIONS = ['not-started', 'in-progress', 'cancelled', 'completed']

const STATUS_LABELS = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  cancelled: 'Cancelled',
  completed: 'Completed',
}

function formatDateLabel(value) {
  if (!value) return '—'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('MMMM D, YYYY h:mm A') : '—'
}

export default function TaskDetails() {
  const navigate = useNavigate()
  const location = useLocation()
  const { taskId } = useParams()
  const { plans } = useTaskManager()

  const planFromState = location.state?.plan ?? null
  const taskFromState = location.state?.task ?? null
  let plan = planFromState
  let task = taskFromState

  if ((!plan || !task) && Array.isArray(plans)) {
    const lookupPlan = plans.find(entry =>
      Array.isArray(entry.tasks) && entry.tasks.some(item => item.id === taskId),
    )
    if (lookupPlan) {
      const lookupTask = lookupPlan.tasks.find(item => item.id === taskId)
      if (lookupTask) {
        plan =
          plan ??
          {
            id: lookupPlan.id,
            title: lookupPlan.title,
            description: lookupPlan.description ?? '',
            status: lookupPlan.status ?? 'not-started',
          }
        task = task ?? { ...lookupTask }
      }
    }
  }

  const createdLabel = task ? formatDateLabel(task.createdAt) : '—'
  const startLabel = task ? formatDateLabel(task.startAt) : '—'
  const completedLabel = task ? formatDateLabel(task.completedAt) : '—'
  const statusLabel =
    task && task.status ? STATUS_LABELS[task.status] ?? STATUS_LABELS['not-started'] : 'Not started'

  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  if (!plan || !task) {
    return (
      <div className="task-detail-page">
        <div className="task-detail__left">
          <button type="button" className="task-detail__back-btn" onClick={handleBack}>
            ← Back
          </button>
          <div className="task-detail__content">
            <h1 className="task-detail__title">Task unavailable</h1>
            <p className="task-detail__description">
              We couldn't load the details for task&nbsp;
              <span className="task-detail__code">#{taskId}</span>. Return to your dashboard and try
              opening it again.
            </p>
            <button type="button" className="btn cat-primary" onClick={() => navigate('/')}>
              Go to dashboard
            </button>
          </div>
        </div>
        <div className="task-detail__right" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="task-detail-page">
      <div className="task-detail__left">
        <button type="button" className="task-detail__back-btn" onClick={handleBack}>
          ← Back
        </button>

        <section className="task-detail__content" aria-labelledby="task-detail-title">
          <header className="task-detail__header">
            <p className="task-detail__plan">{plan.title}</p>
            <h1 className="task-detail__title" id="task-detail-title">
              {task.title}
            </h1>
            <span className={`task-detail__status status-${task.status}`}>{statusLabel}</span>
          </header>

          {task.description && (
            <p className="task-detail__description">{task.description}</p>
          )}

          {plan.description && (
            <div className="task-detail__plan-notes">
              <h2>Plan notes</h2>
              <p>{plan.description}</p>
            </div>
          )}

          <dl className="task-detail__meta">
            <div>
              <dt>Created</dt>
              <dd>{createdLabel}</dd>
            </div>
            <div>
              <dt>Start</dt>
              <dd>{startLabel}</dd>
            </div>
            <div>
              <dt>Completed</dt>
              <dd>{completedLabel}</dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="task-detail__right" aria-hidden="true" />
    </div>
  )
}
