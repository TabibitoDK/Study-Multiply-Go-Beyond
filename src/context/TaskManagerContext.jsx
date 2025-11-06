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

function toIsoOrNull(value) {
  if (!value) return null
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.toISOString() : null
}

function computePlanDueDate(tasks, fallback = null) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return fallback
  }
  return (
    tasks.reduce((latest, task) => {
      if (!task || !task.dueDate) {
        return latest
      }
      if (!latest || task.dueDate > latest) {
        return task.dueDate
      }
      return latest
    }, null) ?? fallback
  )
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key)
}

function buildDefaultPlans() {
  const plans = [
    {
      id: 'lt-math-transfer',
      title: '編入数学徹底研究',
      description: '編入試験に向けて数学基礎から応用まで体系的に強化する。',
      status: 'in-progress',
      tasks: [
        {
          id: 'task-math-0',
          title: '線形代数総復習',
          description: '行列・固有値・対角化を解説ノートにまとめる。',
          status: 'completed',
          createdAt: '2025-10-10T09:00:00.000Z',
          startAt: '2025-10-10T09:00:00.000Z',
          completedAt: '2025-10-12T14:30:00.000Z',
        },
        {
          id: 'task-math-1',
          title: '微分積分の典型問題100題',
          description: '過去問形式の典型パターンを徹底習得する。',
          status: 'in-progress',
          createdAt: '2025-10-15T08:30:00.000Z',
          startAt: '2025-10-15T08:30:00.000Z',
          completedAt: null,
        },
        {
          id: 'task-math-2',
          title: '物理（力学）の公式整理シート作成',
          description: '運動方程式・エネルギー保存則をわかりやすく整理。',
          status: 'not-started',
          createdAt: '2025-10-22T16:00:00.000Z',
          startAt: '2025-10-22T16:00:00.000Z',
          completedAt: null,
        },
        {
          id: 'task-math-3',
          title: '編入過去問 3年分解き直し',
          description: 'できなかった問題には改善コメントを記入。',
          status: 'not-started',
          createdAt: '2025-11-01T10:45:00.000Z',
          startAt: '2025-11-01T10:45:00.000Z',
          completedAt: null,
        },
      ],
    },
    {
      id: 'lt-toeic-english',
      title: 'TOEIC英語集中トレーニング',
      description: '目標スコアアップのためにリスニングと語彙を強化する。',
      status: 'not-started',
      tasks: [
        {
          id: 'task-eng-0',
          title: '公式問題集1セット解く',
          description: '時間を計って本番形式で実施。',
          status: 'completed',
          createdAt: '2025-10-05T13:30:00.000Z',
          startAt: '2025-10-05T13:30:00.000Z',
          completedAt: '2025-10-05T15:50:00.000Z',
        },
        {
          id: 'task-eng-1',
          title: '毎日20分の単語暗記（600〜800点レベル）',
          description: 'アプリとノートを併用して反復。',
          status: 'in-progress',
          createdAt: '2025-10-20T07:00:00.000Z',
          startAt: '2025-10-20T07:00:00.000Z',
          completedAt: null,
        },
        {
          id: 'task-eng-2',
          title: 'リスニングシャドーイング',
          description: 'Part3・4を中心にスピード慣れを意識。',
          status: 'not-started',
          createdAt: '2025-10-25T12:00:00.000Z',
          startAt: '2025-10-25T12:00:00.000Z',
          completedAt: null,
        },
        {
          id: 'task-eng-3',
          title: '模試スコア分析と弱点克服',
          description: '文法と語彙問題の傾向を掴む。',
          status: 'not-started',
          createdAt: '2025-11-03T09:30:00.000Z',
          startAt: '2025-11-03T09:30:00.000Z',
          completedAt: null,
        },
      ],
    },
    {
      id: 'lt-lab-report',
      title: '実験レポート仕上げ',
      description: '測定結果を整理し、考察を明確に記述する。',
      status: 'in-progress',
      tasks: [
        {
          id: 'task-lab-0',
          title: 'データ整理・グラフ化',
          description: 'PythonまたはExcelで見やすい表とプロットを作る。',
          status: 'completed',
          createdAt: '2025-10-18T14:10:00.000Z',
          startAt: '2025-10-18T14:10:00.000Z',
          completedAt: '2025-10-18T17:20:00.000Z',
        },
        {
          id: 'task-lab-1',
          title: '実験目的・手法の文章化',
          description: '授業資料を参照しながら簡潔にまとめる。',
          status: 'in-progress',
          createdAt: '2025-10-21T10:00:00.000Z',
          startAt: '2025-10-21T10:00:00.000Z',
          completedAt: null,
        },
        {
          id: 'task-lab-2',
          title: '考察パート執筆',
          description: '誤差要因、改善案、理論との整合性について詳述。',
          status: 'not-started',
          createdAt: '2025-10-28T19:00:00.000Z',
          startAt: '2025-10-28T19:00:00.000Z',
          completedAt: null,
        },
        {
          id: 'task-lab-3',
          title: '最終チェックと提出',
          description: '誤字・図番号・引用を整える。',
          status: 'not-started',
          createdAt: '2025-11-05T08:45:00.000Z',
          startAt: '2025-11-05T08:45:00.000Z',
          completedAt: null,
        },
      ],
    },
  ]

  return plans.map(plan => {
    const tasks = Array.isArray(plan.tasks)
      ? plan.tasks.map(task => ({
          ...task,
          dueDate: task.dueDate ?? task.startAt ?? task.createdAt ?? task.completedAt ?? null,
        }))
      : []
    return {
      ...plan,
      tasks,
      dueDate: plan.dueDate ?? computePlanDueDate(tasks, null),
    }
  })
}

export function TaskManagerProvider({ children }) {
  const [plans, setPlans] = useState(() => buildDefaultPlans())

  const addPlan = useCallback(({ title, description, dueDate }) => {
    const plan = {
      id: createId('lt'),
      title,
      description: description ?? '',
      status: 'not-started',
      dueDate: toIsoOrNull(dueDate),
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
    const status = data.status ?? 'not-started'
    const createdAt = toIsoOrNull(data.createdAt) ?? now.toISOString()
    const startAt = toIsoOrNull(data.startAt) ?? createdAt
    const dueDate = toIsoOrNull(data.dueDate) ?? startAt ?? createdAt
    const completedAt =
      status === 'completed'
        ? toIsoOrNull(data.completedAt) ?? now.toISOString()
        : null

    const task = {
      id: createId('task'),
      title: data.title,
      description: data.description ?? '',
      status,
      createdAt,
      startAt,
      dueDate,
      completedAt,
    }

    setPlans(prev =>
      prev.map(plan => {
        if (plan.id !== planId) {
          return plan
        }
        const nextTasks = [task, ...(plan.tasks ?? [])]
        return {
          ...plan,
          tasks: nextTasks,
          dueDate: computePlanDueDate(nextTasks, plan.dueDate ?? dueDate),
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
        const nextTasks = (plan.tasks ?? []).map(task => {
          if (task.id !== taskId) {
            return task
          }
          previousTask = task
          nextTask = {
            ...task,
            status,
            completedAt: status === 'completed' ? completedAt : null,
          }
          return nextTask
        })
        return {
          ...plan,
          tasks: nextTasks,
          dueDate: computePlanDueDate(nextTasks, plan.dueDate),
        }
      }),
    )

    if (!nextTask && previousTask) {
      nextTask = {
        ...previousTask,
        status,
        completedAt: status === 'completed' ? completedAt : null,
      }
    }

    return { previousTask, nextTask }
  }, [])

  const updateTask = useCallback((planId, taskId, updates) => {
    let updatedTask = null
    const payload = updates ?? {}

    setPlans(prev =>
      prev.map(plan => {
        if (plan.id !== planId) {
          return plan
        }

        const nextTasks = (plan.tasks ?? []).map(task => {
          if (task.id !== taskId) {
            return task
          }

          const status = hasOwn(payload, 'status')
            ? payload.status ?? 'not-started'
            : task.status ?? 'not-started'

          let createdAt = task.createdAt ?? null
          if (hasOwn(payload, 'createdAt')) {
            createdAt =
              payload.createdAt === null
                ? null
                : toIsoOrNull(payload.createdAt) ?? createdAt ?? dayjs().toISOString()
          }

          let startAt = task.startAt ?? createdAt
          if (hasOwn(payload, 'startAt')) {
            startAt =
              payload.startAt === null
                ? null
                : toIsoOrNull(payload.startAt) ?? startAt ?? createdAt
          }

          let dueDate = task.dueDate ?? startAt ?? createdAt
          if (hasOwn(payload, 'dueDate')) {
            dueDate =
              payload.dueDate === null
                ? null
                : toIsoOrNull(payload.dueDate) ?? dueDate ?? startAt ?? createdAt
          }

          let completedAt = task.completedAt ?? null
          if (hasOwn(payload, 'completedAt')) {
            completedAt =
              payload.completedAt === null
                ? null
                : toIsoOrNull(payload.completedAt) ?? completedAt
          }

          if (status === 'completed' && !completedAt) {
            completedAt = dayjs().toISOString()
          }

          if (status !== 'completed') {
            completedAt = null
          }

          const nextTask = {
            ...task,
            ...payload,
            title: hasOwn(payload, 'title') ? payload.title ?? '' : task.title,
            description: hasOwn(payload, 'description')
              ? payload.description ?? ''
              : task.description ?? '',
            status,
            createdAt,
            startAt,
            dueDate,
            completedAt,
          }

          updatedTask = nextTask
          return nextTask
        })

        return {
          ...plan,
          tasks: nextTasks,
          dueDate: computePlanDueDate(nextTasks, plan.dueDate),
        }
      }),
    )

    return updatedTask
  }, [])

  const value = useMemo(
    () => ({
      plans,
      addPlan,
      addTask,
      updatePlanStatus,
      updateTaskStatus,
      updateTask,
    }),
    [plans, addPlan, addTask, updatePlanStatus, updateTaskStatus, updateTask],
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
