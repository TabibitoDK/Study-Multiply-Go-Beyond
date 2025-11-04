import { useMemo, useState } from 'react'

const DEFAULT_LONG_TERM_TASKS = [
  {
    id: 'lt-foundations',
    title: 'Foundations Refresh',
    description: 'Strengthen core concepts before midterms.',
    status: 'in-progress',
    tasks: [
      {
        id: 'task-foundations-1',
        title: 'Revisit algebra chapter 4',
        notes: 'Focus on systems of equations and inequalities.',
        status: 'not-started',
        createdAt: '2025-10-20T09:00:00.000Z',
      },
      {
        id: 'task-foundations-2',
        title: 'Create summary sheet for physics formulas',
        notes: 'Include diagrams for momentum and energy.',
        status: 'in-progress',
        createdAt: '2025-10-22T15:30:00.000Z',
      },
    ],
  },
  {
    id: 'lt-language',
    title: 'Language Sprint',
    description: 'Aim for conversational fluency before winter break.',
    status: 'not-started',
    tasks: [
      {
        id: 'task-language-1',
        title: 'Daily 20-minute vocab review',
        notes: 'Use flashcards and practice pronunciation.',
        status: 'not-started',
        createdAt: '2025-10-23T07:45:00.000Z',
      },
      {
        id: 'task-language-2',
        title: 'Weekly conversation session',
        notes: 'Schedule with language partner on Saturday.',
        status: 'completed',
        createdAt: '2025-10-19T11:20:00.000Z',
        completedAt: '2025-10-25T17:05:00.000Z',
      },
    ],
  },
  {
    id: 'lt-capstone',
    title: 'Capstone Project',
    description: 'Ship MVP demo with the study companion team.',
    status: 'in-progress',
    tasks: [
      {
        id: 'task-capstone-1',
        title: 'Outline user journey',
        notes: 'Identify key moments and pain points.',
        status: 'in-progress',
        createdAt: '2025-10-24T10:15:00.000Z',
      },
      {
        id: 'task-capstone-2',
        title: 'Prepare stakeholder update',
        notes: 'Summarize progress and blockers for Monday sync.',
        status: 'not-started',
        createdAt: '2025-10-26T18:00:00.000Z',
      },
    ],
  },
]

const STATUS_LABELS = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  cancelled: 'Cancelled',
  completed: 'Completed',
}

const TASK_STATUS_OPTIONS = ['not-started', 'in-progress', 'cancelled', 'completed']

const LONG_TERM_STATUS_OPTIONS = ['not-started', 'in-progress', 'cancelled', 'completed']

function createId(prefix) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  const randomSuffix = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${Date.now()}-${randomSuffix}`
}

export default function HomeDashboard({
  onOpenProfile,
  currentTask,
  onSetCurrentTask,
  onCompleteTask,
}) {
  const [activeTab, setActiveTab] = useState('tasks')
  const [longTermTasks, setLongTermTasks] = useState(() => DEFAULT_LONG_TERM_TASKS)
  const [selectedLongTermId, setSelectedLongTermId] = useState(
    () => DEFAULT_LONG_TERM_TASKS[0]?.id ?? null,
  )
  const [isAddingLongTerm, setIsAddingLongTerm] = useState(false)
  const [newLongTermTitle, setNewLongTermTitle] = useState('')
  const [newLongTermDescription, setNewLongTermDescription] = useState('')

  const [isAddingShortTask, setIsAddingShortTask] = useState(false)
  const [newShortTaskTitle, setNewShortTaskTitle] = useState('')
  const [newShortTaskNotes, setNewShortTaskNotes] = useState('')
  const [taskStatusFilter, setTaskStatusFilter] = useState('all')
  const [taskSearchQuery, setTaskSearchQuery] = useState('')

  const selectedLongTerm = useMemo(
    () => longTermTasks.find(item => item.id === selectedLongTermId) ?? null,
    [longTermTasks, selectedLongTermId],
  )

  const filteredTasks = useMemo(() => {
    if (!selectedLongTerm) return []
    const normalizedQuery = taskSearchQuery.trim().toLowerCase()
    return selectedLongTerm.tasks.filter(task => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        task.title.toLowerCase().includes(normalizedQuery) ||
        (task.notes && task.notes.toLowerCase().includes(normalizedQuery))
      const matchesStatus = taskStatusFilter === 'all' ? true : task.status === taskStatusFilter
      return matchesSearch && matchesStatus
    })
  }, [selectedLongTerm, taskSearchQuery, taskStatusFilter])

  function handleSelectLongTerm(id) {
    setSelectedLongTermId(id)
    setIsAddingShortTask(false)
    setNewShortTaskTitle('')
    setNewShortTaskNotes('')
    setTaskStatusFilter('all')
    setTaskSearchQuery('')
  }

  function handleAddLongTerm(event) {
    event.preventDefault()
    const title = newLongTermTitle.trim()
    if (!title) return

    const longTerm = {
      id: createId('lt'),
      title,
      description: newLongTermDescription.trim(),
      status: 'not-started',
      tasks: [],
    }

    setLongTermTasks(prev => [...prev, longTerm])
    setSelectedLongTermId(longTerm.id)
    setIsAddingLongTerm(false)
    setNewLongTermTitle('')
    setNewLongTermDescription('')
  }

  function handleAddShortTask(event) {
    event.preventDefault()
    if (!selectedLongTerm) return

    const title = newShortTaskTitle.trim()
    if (!title) return

    const task = {
      id: createId('task'),
      title,
      notes: newShortTaskNotes.trim(),
      status: 'not-started',
      createdAt: new Date().toISOString(),
    }

    setLongTermTasks(prev =>
      prev.map(group => {
        if (group.id !== selectedLongTerm.id) {
          return group
        }
        return {
          ...group,
          tasks: [task, ...group.tasks],
        }
      }),
    )

    setIsAddingShortTask(false)
    setNewShortTaskTitle('')
    setNewShortTaskNotes('')
  }

  function handleLongTermStatusChange(longTermId, status) {
    setLongTermTasks(prev =>
      prev.map(group =>
        group.id === longTermId
          ? {
              ...group,
              status,
            }
          : group,
      ),
    )
  }

  function handleTaskStatusChange(taskId, status) {
    if (!selectedLongTerm) return
    const priorTask = selectedLongTerm.tasks.find(task => task.id === taskId)
    setLongTermTasks(prev =>
      prev.map(group => {
        if (group.id !== selectedLongTerm.id) {
          return group
        }
        return {
          ...group,
          tasks: group.tasks.map(task => {
            if (task.id !== taskId) {
              return task
            }
            return {
              ...task,
              status,
              completedAt: status === 'completed' ? new Date().toISOString() : null,
            }
          }),
        }
      }),
    )

    if (!priorTask) {
      return
    }

    if (status === 'in-progress' && typeof onSetCurrentTask === 'function') {
      onSetCurrentTask(priorTask.title)
    }

    if (status === 'completed' && typeof onCompleteTask === 'function') {
      onCompleteTask(priorTask.title)
    }
  }

  const longTermCount = longTermTasks.length
  const shortTaskCount = selectedLongTerm?.tasks.length ?? 0
  const visibleTaskCount = filteredTasks.length
  const selectedPlanStatusId = selectedLongTerm
    ? `plan-status-${selectedLongTerm.id}`
    : 'plan-status-select'
  const selectedPlanStatus = selectedLongTerm?.status ?? 'not-started'

  return (
    <div className="main-dashboard">
      {typeof onOpenProfile === 'function' && (
        <header className="main-dashboard__header">
          <button type="button" className="btn ghost" onClick={onOpenProfile}>
            View profile
          </button>
        </header>
      )}

      <div className="main-dashboard__tabs" role="tablist" aria-label="Dashboard sections">
        <button
          type="button"
          className={`main-dashboard__tab${activeTab === 'tasks' ? ' is-active' : ''}`}
          onClick={() => setActiveTab('tasks')}
          role="tab"
          aria-selected={activeTab === 'tasks'}
        >
          Tasks
        </button>
        <button
          type="button"
          className={`main-dashboard__tab${activeTab === 'progress' ? ' is-active' : ''}`}
          onClick={() => setActiveTab('progress')}
          role="tab"
          aria-selected={activeTab === 'progress'}
        >
          Progress
        </button>
      </div>

      <section className="main-dashboard__panels">
        {activeTab === 'tasks' ? (
          <div className="task-panel">
            <div className="task-panel__column">
              <div className="task-panel__header">
                <div>
                  <h2 className="task-panel__title">Long-term focus</h2>
                  <p className="task-panel__meta">
                    {longTermCount} plan{longTermCount === 1 ? '' : 's'}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn cat-primary"
                  onClick={() => setIsAddingLongTerm(prev => !prev)}
                >
                  {isAddingLongTerm ? 'Cancel' : 'Add plan'}
                </button>
              </div>

              {isAddingLongTerm && (
                <form className="task-panel__form" onSubmit={handleAddLongTerm}>
                  <label className="task-panel__label" htmlFor="new-long-term-title">
                    Plan name
                  </label>
                  <input
                    id="new-long-term-title"
                    className="input"
                    value={newLongTermTitle}
                    onChange={event => setNewLongTermTitle(event.target.value)}
                    placeholder="e.g. Exam preparation"
                    autoFocus
                  />
                  <label className="task-panel__label" htmlFor="new-long-term-description">
                    Summary (optional)
                  </label>
                  <textarea
                    id="new-long-term-description"
                    className="input"
                    rows={2}
                    value={newLongTermDescription}
                    onChange={event => setNewLongTermDescription(event.target.value)}
                    placeholder="Add quick notes for this focus area."
                  />
                  <div className="task-panel__form-actions">
                    <button type="submit" className="btn">
                      Save plan
                    </button>
                  </div>
                </form>
              )}

              <ul className="long-term-list">
                {longTermTasks.map(group => {
                  const isActive = group.id === selectedLongTermId
                  const currentStatus = group.status ?? 'not-started'
                  return (
                    <li key={group.id}>
                      <div className={`long-term-list__item${isActive ? ' is-active' : ''}`}>
                        <button
                          type="button"
                          className="long-term-list__trigger"
                          onClick={() => handleSelectLongTerm(group.id)}
                        >
                          <span className="long-term-list__title">{group.title}</span>
                          <span className="long-term-list__count">
                            {group.tasks.length} task{group.tasks.length === 1 ? '' : 's'}
                          </span>
                          {group.description && (
                            <span className="long-term-list__description">{group.description}</span>
                          )}
                        </button>
                        <span className={`long-term-list__status status-${currentStatus}`}>
                          {STATUS_LABELS[currentStatus] ?? STATUS_LABELS['not-started']}
                        </span>
                      </div>
                    </li>
                  )
                })}
                {longTermTasks.length === 0 && (
                  <li className="long-term-list__empty">
                    Add a plan to begin tracking your long-term goals.
                  </li>
                )}
              </ul>
            </div>

            <div className="task-panel__column task-panel__column--primary">
              <div className="task-panel__header">
                <div>
                  <h2 className="task-panel__title">
                    {selectedLongTerm ? selectedLongTerm.title : 'Choose a plan'}
                  </h2>
                  <p className="task-panel__meta">
                    {selectedLongTerm
                      ? `Showing ${visibleTaskCount} of ${shortTaskCount} task${
                          shortTaskCount === 1 ? '' : 's'
                        }`
                      : 'Select a plan to view its tasks.'}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn"
                  disabled={!selectedLongTerm}
                  onClick={() => setIsAddingShortTask(prev => !prev)}
                >
                  {isAddingShortTask ? 'Cancel' : 'Add task'}
                </button>
              </div>

              {selectedLongTerm && (
                <div className="task-panel__plan-bar">
                  <p
                    className={`task-panel__plan-summary${
                      selectedLongTerm.description ? '' : ' is-empty'
                    }`}
                  >
                    {selectedLongTerm.description ||
                      'Add a quick note to keep the focus of this plan clear.'}
                  </p>
                  <div className="task-panel__plan-controls">
                    <label className="task-panel__filters-label" htmlFor={selectedPlanStatusId}>
                      Plan status
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
                          {STATUS_LABELS[option]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {isAddingShortTask && selectedLongTerm && (
                <form className="task-panel__form" onSubmit={handleAddShortTask}>
                  <label className="task-panel__label" htmlFor="new-short-task-title">
                    Task name
                  </label>
                  <input
                    id="new-short-task-title"
                    className="input"
                    value={newShortTaskTitle}
                    onChange={event => setNewShortTaskTitle(event.target.value)}
                    placeholder="Focus session or deliverable"
                    autoFocus
                  />
                  <label className="task-panel__label" htmlFor="new-short-task-notes">
                    Notes (optional)
                  </label>
                  <textarea
                    id="new-short-task-notes"
                    className="input"
                    rows={3}
                    value={newShortTaskNotes}
                    onChange={event => setNewShortTaskNotes(event.target.value)}
                    placeholder="Add context, resources, or checkpoints."
                  />
                  <div className="task-panel__form-actions">
                    <button type="submit" className="btn cat-primary">
                      Save task
                    </button>
                  </div>
                </form>
              )}

              {selectedLongTerm && selectedLongTerm.tasks.length > 0 && (
                <div className="task-panel__filters" role="group" aria-label="Task filters">
                  <div className="task-panel__search">
                    <label className="task-panel__filters-label" htmlFor="task-search-input">
                      Search
                    </label>
                    <input
                      id="task-search-input"
                      className="input"
                      type="search"
                      placeholder="Find a task..."
                      value={taskSearchQuery}
                      onChange={event => setTaskSearchQuery(event.target.value)}
                    />
                  </div>
                  <div className="task-panel__filter">
                    <label className="task-panel__filters-label" htmlFor="task-status-filter">
                      Status
                    </label>
                    <select
                      id="task-status-filter"
                      className="status-select"
                      value={taskStatusFilter}
                      onChange={event => setTaskStatusFilter(event.target.value)}
                    >
                      <option value="all">All statuses</option>
                      {TASK_STATUS_OPTIONS.map(option => (
                        <option key={option} value={option}>
                          {STATUS_LABELS[option]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {selectedLongTerm ? (
                selectedLongTerm.tasks.length === 0 ? (
                  <div className="task-panel__empty">
                    No tasks yet. Add one to start making progress.
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="task-panel__empty">
                    No tasks match your filters. Adjust or clear them to see more tasks.
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
                        >
                          <header className="task-card__header">
                            <span className={statusLabelClass}>
                              {STATUS_LABELS[task.status] ?? STATUS_LABELS['not-started']}
                            </span>
                            {isCurrent && <span className="task-card__badge">In focus</span>}
                          </header>
                          <h3 className="task-card__title">{task.title}</h3>
                          {task.notes && <p className="task-card__notes">{task.notes}</p>}
                          <footer className="task-card__footer">
                            <label className="task-card__footer-label" htmlFor={selectId}>
                              Status
                            </label>
                            <select
                              id={selectId}
                              className="status-select task-card__status-select"
                              value={task.status}
                              onChange={event => handleTaskStatusChange(task.id, event.target.value)}
                            >
                              {TASK_STATUS_OPTIONS.map(option => (
                                <option key={option} value={option}>
                                  {STATUS_LABELS[option]}
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
                  Select a long-term focus on the left to view its tasks.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="progress-panel" aria-label="Progress tab" />
        )}
      </section>
    </div>
  )
}
