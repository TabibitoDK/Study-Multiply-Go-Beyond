import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { useTaskManager } from '../context/TaskManagerContext.jsx'
import { useTranslation } from 'react-i18next'

const TASK_STATUS_OPTIONS = ['not-started', 'in-progress', 'cancelled', 'completed']

const STATUS_LABEL_KEYS = {
  'not-started': 'taskDetails.status.notStarted',
  'in-progress': 'taskDetails.status.inProgress',
  cancelled: 'taskDetails.status.cancelled',
  completed: 'taskDetails.status.completed',
}

function formatDateLabel(value, fallback, formatString) {
  if (!value) return fallback
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format(formatString) : fallback
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
  const { t, i18n } = useTranslation()

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
  const emptyLabel = t('taskDetails.labels.notAvailable')
  const dateFormat = i18n.language?.startsWith('ja') ? 'YYYY年M月D日 HH:mm' : 'MMMM D, YYYY h:mm A'

  useEffect(() => {
    if (!task) {
      setFormState(buildTaskFormState(null))
      return
    }
    if (!isEditing) {
      setFormState(buildTaskFormState(task))
    }
  }, [task?.id, task?.trackedMinutes, isEditing])

  const createdLabel = task ? formatDateLabel(task.createdAt, emptyLabel, dateFormat) : emptyLabel
  const startLabel = task ? formatDateLabel(task.startAt, emptyLabel, dateFormat) : emptyLabel
  const completedLabel = task ? formatDateLabel(task.completedAt, emptyLabel, dateFormat) : emptyLabel
  const dueLabel = task ? formatDateLabel(task.dueDate, emptyLabel, dateFormat) : emptyLabel
  const statusLabel =
    task && task.status
      ? t(STATUS_LABEL_KEYS[task.status] ?? STATUS_LABEL_KEYS['not-started'])
      : t(STATUS_LABEL_KEYS['not-started'])
  const timeSpentLabel =
    typeof task?.trackedMinutes === 'number' && task.trackedMinutes >= 0
      ? t('taskDetails.timeSpentLabel', { count: task.trackedMinutes })
      : t('taskDetails.timeSpentLabel', { count: 0 })

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
      setFormError(t('taskDetails.errors.save'))
    } finally {
      setSaving(false)
    }
  }

  if (!plan || !task) {
    return (
      <div className="task-detail-page">
        <div className="task-detail__left">
          <button type="button" className="task-detail__back-btn" onClick={handleBack}>
            <span aria-hidden="true">&larr;</span> {t('taskDetails.buttons.back')}
          </button>
          <div className="task-detail__content">
            <h1 className="task-detail__title">{t('taskDetails.errors.unavailableTitle')}</h1>
            <p className="task-detail__description">
              {t('taskDetails.errors.unavailableDescription', { id: taskId })}
            </p>
            <button type="button" className="btn cat-primary" onClick={() => navigate('/')}>
              {t('taskDetails.buttons.dashboard')}
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
          <span aria-hidden="true">&larr;</span> {t('taskDetails.buttons.back')}
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
                {t('taskDetails.actions.edit')}
              </button>
            ) : (
              <button type="button" className="btn ghost" onClick={handleCancelEdit}>
                {t('taskDetails.actions.cancelEdit')}
              </button>
            )}
          </div>

          {task.description && (
            <p className="task-detail__description">{task.description}</p>
          )}

          {plan.description && (
            <div className="task-detail__plan-notes">
              <h2>{t('taskDetails.planNotes')}</h2>
              <p>{plan.description}</p>
            </div>
          )}

          <dl className="task-detail__meta">
            <div>
              <dt>{t('taskDetails.meta.created')}</dt>
              <dd>{createdLabel}</dd>
            </div>
            <div>
              <dt>{t('taskDetails.meta.start')}</dt>
              <dd>{startLabel}</dd>
            </div>
            <div>
              <dt>{t('taskDetails.meta.due')}</dt>
              <dd>{dueLabel}</dd>
            </div>
            <div>
              <dt>{t('taskDetails.meta.completed')}</dt>
              <dd>{completedLabel}</dd>
            </div>
            <div>
              <dt>{t('taskDetails.meta.timeSpent')}</dt>
              <dd>{timeSpentLabel}</dd>
            </div>
          </dl>

          {isEditing && (
            <form className="task-detail__form" onSubmit={handleSubmit}>
              <div className="task-detail__form-grid">
                <label className="task-detail__form-field">
                  <span>{t('taskDetails.form.title')}</span>
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
                  <span>{t('taskDetails.form.status')}</span>
                  <select
                    name="status"
                    className="input"
                    value={formState.status}
                    onChange={handleFieldChange}
                  >
                    {TASK_STATUS_OPTIONS.map(option => (
                      <option key={option} value={option}>
                        {t(STATUS_LABEL_KEYS[option])}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="task-detail__form-field">
                  <span>{t('taskDetails.form.start')}</span>
                  <input
                    type="datetime-local"
                    name="startAt"
                    className="input"
                    value={formState.startAt}
                    onChange={handleFieldChange}
                  />
                </label>

                <label className="task-detail__form-field">
                  <span>{t('taskDetails.form.due')}</span>
                  <input
                    type="datetime-local"
                    name="dueDate"
                    className="input"
                    value={formState.dueDate}
                    onChange={handleFieldChange}
                  />
                </label>

                <label className="task-detail__form-field task-detail__form-field--full">
                  <span>{t('taskDetails.form.description')}</span>
                  <textarea
                    name="description"
                    className="input"
                    value={formState.description}
                    onChange={handleFieldChange}
                    rows={3}
                  />
                </label>

                <label className="task-detail__form-field">
                  <span>{t('taskDetails.form.timeSpent')}</span>
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
                  {t('taskDetails.actions.discard')}
                </button>
                <button type="submit" className="btn cat-primary" disabled={saving}>
                  {saving ? t('taskDetails.actions.saving') : t('taskDetails.actions.saveChanges')}
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
