import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import dayjs from 'dayjs'

const TaskManagerContext = createContext(null)

function createId(prefix) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  const random = Math.random().toString(16).slice(2, 10)
  const stamp = Date.now().toString(16)
  return `${prefix}-${stamp}-${random}`
}

function buildDefaultPlans() {
  return [
    {
      id: 'lt-foundations',
      title: 'Foundations Refresh',
      description: 'Strengthen core concepts before midterms.',
      status: 'in-progress',
      tasks: [
        {
          id: 'task-foundations-0',
          title: 'Summer refresher workshop',
          description: 'Weekend intensive on calculus review.',
          status: 'completed',
          createdAt: '2025-07-12T09:30:00.000Z',
          startAt: '2025-07-12T09:30:00.000Z',
          completedAt: '2025-07-13T12:45:00.000Z',
        },
        {
          id: 'task-foundations-1',
          title: 'Revisit algebra chapter 4',
          description: 'Focus on systems of equations and inequalities.',
          status: 'not-started',
          createdAt: '2025-10-20T09:00:00.000Z',
          startAt: '2025-10-20T09:00:00.000Z',
          completedAt: null,
        },
        {
          id: 'task-foundations-2',
          title: 'Create summary sheet for physics formulas',
          description: 'Include diagrams for momentum and energy.',
          status: 'in-progress',
          createdAt: '2025-10-22T15:30:00.000Z',
          startAt: '2025-10-22T15:30:00.000Z',
          completedAt: '2025-11-02T14:45:00.000Z',
        },
        {
          id: 'task-foundations-3',
          title: 'Mock exam review',
          description: 'Revisit incorrect questions and annotate learnings.',
          status: 'completed',
          createdAt: '2025-11-05T09:15:00.000Z',
          startAt: '2025-11-05T09:15:00.000Z',
          completedAt: '2025-11-07T11:30:00.000Z',
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
          id: 'task-language-0',
          title: 'Summer language bootcamp',
          description: 'Immersive session with native speakers.',
          status: 'completed',
          createdAt: '2025-08-02T10:00:00.000Z',
          startAt: '2025-08-02T10:00:00.000Z',
          completedAt: '2025-08-02T15:45:00.000Z',
        },
        {
          id: 'task-language-1',
          title: 'Daily 20-minute vocab review',
          description: 'Use flashcards and practice pronunciation.',
          status: 'not-started',
          createdAt: '2025-10-23T07:45:00.000Z',
          startAt: '2025-10-23T07:45:00.000Z',
          completedAt: null,
        },
        {
          id: 'task-language-2',
          title: 'Weekly conversation session',
          description: 'Schedule with language partner on Saturday.',
          status: 'completed',
          createdAt: '2025-10-19T11:20:00.000Z',
          startAt: '2025-10-19T11:20:00.000Z',
          completedAt: '2025-10-25T17:05:00.000Z',
        },
        {
          id: 'task-language-3',
          title: 'Grammar drill marathon',
          description: 'Focus on conditional tenses.',
          status: 'completed',
          createdAt: '2025-11-12T08:45:00.000Z',
          startAt: '2025-11-12T08:45:00.000Z',
          completedAt: '2025-11-12T10:30:00.000Z',
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
          id: 'task-capstone-0',
          title: 'Brainstorm project scope',
          description: 'Early ideation to align on outcomes.',
          status: 'completed',
          createdAt: '2025-09-05T11:00:00.000Z',
          startAt: '2025-09-05T11:00:00.000Z',
          completedAt: '2025-09-05T14:20:00.000Z',
        },
        {
          id: 'task-capstone-1',
          title: 'Outline user journey',
          description: 'Identify key moments and pain points.',
          status: 'in-progress',
          createdAt: '2025-10-24T10:15:00.000Z',
          startAt: '2025-10-24T10:15:00.000Z',
          completedAt: '2025-11-01T16:00:00.000Z',
        },
        {
          id: 'task-capstone-2',
          title: 'Prepare stakeholder update',
          description: 'Summarize progress and blockers for Monday sync.',
          status: 'not-started',
          createdAt: '2025-10-26T18:00:00.000Z',
          startAt: '2025-10-26T18:00:00.000Z',
          completedAt: null,
        },
        {
          id: 'task-capstone-3',
          title: 'Prototype usability test',
          description: 'Conduct quick hallway test with 3 peers.',
          status: 'completed',
          createdAt: '2025-11-15T13:00:00.000Z',
          startAt: '2025-11-15T13:00:00.000Z',
          completedAt: '2025-11-15T15:15:00.000Z',
        },
      ],
    },
  ]
}

export function TaskManagerProvider({ children }) {
  const [plans, setPlans] = useState(() => buildDefaultPlans())

  const addPlan = useCallback(({ title, description }) => {
    const plan = {
      id: createId('lt'),
      title,
      description: description ?? '',
      status: 'not-started',
      tasks: [],
    }
    setPlans(prev => [...prev, plan])
    return plan
  }, [])

  const updatePlanStatus = useCallback((planId, status) => {
    setPlans(prev =>
      prev.map(plan =>
        plan.id === planId
          ? {
              ...plan,
              status,
            }
          : plan,
      ),
    )
  }, [])

  const addTask = useCallback((planId, data) => {
    const now = dayjs()
    const createdAt = data.createdAt ?? now.toISOString()
    const startAt =
      data.startAt && dayjs(data.startAt).isValid()
        ? dayjs(data.startAt).toISOString()
        : createdAt
    const task = {
      id: createId('task'),
      title: data.title,
      description: data.description ?? '',
      status: data.status ?? 'not-started',
      createdAt,
      startAt,
      completedAt: data.completedAt ?? null,
    }

    setPlans(prev =>
      prev.map(plan => {
        if (plan.id !== planId) {
          return plan
        }
        return {
          ...plan,
          tasks: [task, ...(plan.tasks ?? [])],
        }
      }),
    )

    return task
  }, [])

  const updateTaskStatus = useCallback((planId, taskId, status) => {
    let previousTask = null
    let nextTask = null
    const completedAt = status === 'completed' ? dayjs().toISOString() : null

    setPlans(prev =>
      prev.map(plan => {
        if (plan.id !== planId) {
          return plan
        }
        return {
          ...plan,
          tasks: plan.tasks.map(task => {
            if (task.id !== taskId) {
              return task
            }
            previousTask = task
            nextTask = {
              ...task,
              status,
              completedAt,
            }
            return nextTask
          }),
        }
      }),
    )

    if (!nextTask && previousTask) {
      nextTask = {
        ...previousTask,
        status,
        completedAt,
      }
    }

    return { previousTask, nextTask }
  }, [])

  const value = useMemo(
    () => ({
      plans,
      addPlan,
      addTask,
      updatePlanStatus,
      updateTaskStatus,
    }),
    [plans, addPlan, addTask, updatePlanStatus, updateTaskStatus],
  )

  return <TaskManagerContext.Provider value={value}>{children}</TaskManagerContext.Provider>
}

export function useTaskManager() {
  const context = useContext(TaskManagerContext)
  if (!context) {
    throw new Error('useTaskManager must be used within a TaskManagerProvider')
  }
  return context
}
