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

function toDateTimeLocal(value) {
  if (!value) return ''
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DDTHH:mm') : ''
}

function buildTaskFormState(task) {
  if (!task) {
    return {
      title: '',
      description: '',
      status: 'not-started',
      startAt: '',
      dueDate: '',
      trackedMinutes: '',
    }
  }
  return {
    title: task.title ?? '',
    description: task.description ?? '',
    status: task.status ?? 'not-started',
    startAt: toDateTimeLocal(task.startAt),
    dueDate: toDateTimeLocal(task.dueDate),
    trackedMinutes:
      typeof task.trackedMinutes === 'number' && task.trackedMinutes >= 0
        ? String(task.trackedMinutes)
        : '',
  }
}

export default function TaskDetails() {
  const navigate = useNavigate()
  const location = useLocation()
  const { taskId } = useParams()
  const { plans, updateTask } = useTaskManager()

  const planFromState = location.state?.plan ?? null
  const taskFromState = location.state?.task ?? null

  const { plan, task } = useMemo(() => {
    if (Array.isArray(plans)) {
      const lookupPlan = plans.find(entry =>
        Array.isArray(entry.tasks) && entry.tasks.some(item => item.id === taskId),
      )
      if (lookupPlan) {
        const lookupTask = lookupPlan.tasks.find(item => item.id === taskId)
        if (lookupTask) {
          return {
            plan: {
              id: lookupPlan.id,
              title: lookupPlan.title,
              description: lookupPlan.description ?? '',
              status: lookupPlan.status ?? 'not-started',
            },
            task: { ...lookupTask },
          }
        }
      }
    }
    return {
      plan: planFromState ?? null,
      task: taskFromState ?? null,
    }
  }, [plans, planFromState, taskFromState, taskId])

  const [isEditing, setIsEditing] = useState(false)
  const [formState, setFormState] = useState(() => buildTaskFormState(task))
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    if (!task) {
      setFormState(buildTaskFormState(null))
      return
    }
    if (!isEditing) {
      setFormState(buildTaskFormState(task))
    }
  }, [task?.id, task?.trackedMinutes, isEditing])

  const createdLabel = task ? formatDateLabel(task.createdAt) : '—'
  const startLabel = task ? formatDateLabel(task.startAt) : '—'
  const completedLabel = task ? formatDateLabel(task.completedAt) : '—'
  const dueLabel = task ? formatDateLabel(task.dueDate) : '—'
  const statusLabel =
    task && task.status ? STATUS_LABELS[task.status] ?? STATUS_LABELS['not-started'] : 'Not started'
  const timeSpentLabel =
    typeof task?.trackedMinutes === 'number' && task.trackedMinutes >= 0
      ? `${task.trackedMinutes} min`
      : '0 min'

  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  function handleEditToggle() {
    setIsEditing(true)
    setFormError(null)
  }

  function handleCancelEdit() {
    setIsEditing(false)
    setFormError(null)
    setFormState(buildTaskFormState(task))
  }

  function handleFieldChange(event) {
    const { name, value } = event.target
    setFormState(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!plan || !task) return

    setSaving(true)
    setFormError(null)

    try {
      const payload = {
        title: formState.title?.trim() || task.title,
        description: formState.description ? formState.description.trim() : '',
        status: formState.status ?? task.status ?? 'not-started',
        startAt: formState.startAt ? dayjs(formState.startAt).toISOString() : null,
        dueDate: formState.dueDate ? dayjs(formState.dueDate).toISOString() : null,
        trackedMinutes: Math.max(0, Number(formState.trackedMinutes) || 0),
      }

      const updated = await updateTask(plan.id, task.id, payload)
      setIsEditing(false)
      setFormState(buildTaskFormState(updated ?? { ...task, ...payload }))
    } catch (error) {
      console.error('Failed to update task', error)
      setFormError('Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
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

          <div className="task-detail__actions">
            {!isEditing ? (
              <button type="button" className="btn ghost" onClick={handleEditToggle}>
                Edit task
              </button>
            ) : (
              <button type="button" className="btn ghost" onClick={handleCancelEdit}>
                Cancel edit
              </button>
            )}
          </div>

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
              <dt>Due</dt>
              <dd>{dueLabel}</dd>
            </div>
            <div>
              <dt>Completed</dt>
              <dd>{completedLabel}</dd>
            </div>
            <div>
              <dt>Time spent</dt>
              <dd>{timeSpentLabel}</dd>
            </div>
          </dl>

          {isEditing && (
            <form className="task-detail__form" onSubmit={handleSubmit}>
              <div className="task-detail__form-grid">
                <label className="task-detail__form-field">
                  <span>Title</span>
                  <input
                    type="text"
                    name="title"
                    className="input"
                    value={formState.title}
                    onChange={handleFieldChange}
                    required
                  />
                </label>

                <label className="task-detail__form-field">
                  <span>Status</span>
                  <select
                    name="status"
                    className="input"
                    value={formState.status}
                    onChange={handleFieldChange}
                  >
                    {TASK_STATUS_OPTIONS.map(option => (
                      <option key={option} value={option}>
                        {STATUS_LABELS[option]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="task-detail__form-field">
                  <span>Start</span>
                  <input
                    type="datetime-local"
                    name="startAt"
                    className="input"
                    value={formState.startAt}
                    onChange={handleFieldChange}
                  />
                </label>

                <label className="task-detail__form-field">
                  <span>Due</span>
                  <input
                    type="datetime-local"
                    name="dueDate"
                    className="input"
                    value={formState.dueDate}
                    onChange={handleFieldChange}
                  />
                </label>

                <label className="task-detail__form-field task-detail__form-field--full">
                  <span>Description</span>
                  <textarea
                    name="description"
                    className="input"
                    value={formState.description}
                    onChange={handleFieldChange}
                    rows={3}
                  />
                </label>

                <label className="task-detail__form-field">
                  <span>Time spent (minutes)</span>
                  <input
                    type="number"
                    min="0"
                    name="trackedMinutes"
                    className="input"
                    value={formState.trackedMinutes}
                    onChange={handleFieldChange}
                  />
                </label>
              </div>

              {formError && <p className="task-detail__form-error">{formError}</p>}

              <div className="task-detail__form-actions">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  Discard
                </button>
                <button type="submit" className="btn cat-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>

      <div className="task-detail__right" aria-hidden="true" />
    </div>
  )
}
