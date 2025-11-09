import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import { useAuth } from './AuthContext.jsx'

const TaskManagerContext = createContext(null)
const ENABLE_SAMPLE_PLANS = false
const SHOWCASE_USERNAME = 'aiko_hennyu'

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

function preparePlans(plans) {
  return (plans ?? []).map(plan => {
    const tasks = Array.isArray(plan.tasks)
      ? plan.tasks.map(task => ({
          ...task,
          dueDate: task.dueDate ?? task.startAt ?? task.createdAt ?? task.completedAt ?? null,
          trackedMinutes:
            typeof task.trackedMinutes === 'number' && task.trackedMinutes >= 0
              ? Math.round(task.trackedMinutes)
              : 0,
        }))
      : []
    return {
      ...plan,
      tasks,
      dueDate: plan.dueDate ?? computePlanDueDate(tasks, null),
    }
  })
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

  return preparePlans(plans)
}

function buildShowcasePlans() {
  const today = dayjs()
  const planDue = today.add(21, 'day').hour(9).minute(0).second(0).millisecond(0).toISOString()
  const writingPlanDue = today.add(12, 'day').hour(18).minute(0).second(0).millisecond(0).toISOString()

  const makeStamp = (offsetDays, hour = 9, minute = 0) =>
    today.add(offsetDays, 'day').hour(hour).minute(minute).second(0).millisecond(0).toISOString()

  const addMinutes = (isoValue, minutes) => {
    if (!isoValue || typeof minutes !== 'number') return null
    return dayjs(isoValue).add(minutes, 'minute').toISOString()
  }

  const plans = [
    {
      id: 'aiko-plan-transfer',
      title: 'Osaka Tech Transfer Sprint',
      description: 'Three-week push blending past exam drills, tutor prep, and concept mapping.',
      status: 'in-progress',
      category: 'academic',
      tags: ['math', 'engineering', 'focus'],
      dueDate: planDue,
      tasks: [
        {
          id: 'aiko-plan-transfer-task-archive',
          title: 'Eigenvalue archive drills',
          description: 'Full recap of eigen decomposition proofs with handwritten notes.',
          status: 'completed',
          priority: 'high',
          createdAt: makeStamp(-32, 6, 20),
          startAt: makeStamp(-32, 6, 30),
          completedAt: addMinutes(makeStamp(-32, 6, 30), 185),
          dueDate: makeStamp(-31, 10, 0),
          trackedMinutes: 185,
        },
        {
          id: 'aiko-plan-transfer-task-review',
          title: 'Vector calc warm-up set',
          description: 'Chain rule edge cases + divergence/convergence recap.',
          status: 'completed',
          priority: 'medium',
          createdAt: makeStamp(-19, 7, 0),
          startAt: makeStamp(-18, 7, 10),
          completedAt: addMinutes(makeStamp(-18, 7, 10), 135),
          dueDate: makeStamp(-17, 12, 0),
          trackedMinutes: 135,
        },
        {
          id: 'aiko-plan-transfer-task-sim',
          title: 'Past exam simulation (90 min)',
          description: 'Timed mix of 2023 + 2024 Osaka Tech problems, catalog mistakes.',
          status: 'completed',
          priority: 'high',
          createdAt: makeStamp(-10, 12, 0),
          startAt: makeStamp(-9, 13, 0),
          completedAt: addMinutes(makeStamp(-9, 13, 0), 95),
          dueDate: makeStamp(-8, 13, 0),
          trackedMinutes: 95,
        },
        {
          id: 'aiko-plan-transfer-task-map',
          title: 'Mechanics concept map',
          description: 'Turn all chapter highlights into a single-page visual map.',
          status: 'in-progress',
          priority: 'medium',
          createdAt: makeStamp(-3, 8, 45),
          startAt: makeStamp(-2, 9, 20),
          dueDate: makeStamp(1, 9, 0),
          trackedMinutes: 70,
        },
        {
          id: 'aiko-plan-transfer-task-focus',
          title: 'Today focus block',
          description: '45-minute sprint on differential equations text book notes.',
          status: 'in-progress',
          priority: 'high',
          createdAt: makeStamp(0, 6, 50),
          startAt: makeStamp(0, 8, 15),
          dueDate: makeStamp(0, 23, 0),
          trackedMinutes: 45,
        },
        {
          id: 'aiko-plan-transfer-task-tutor',
          title: 'Tutor session prep',
          description: 'Write three targeted questions for Thursday night tutor block.',
          status: 'not-started',
          priority: 'low',
          createdAt: today.toISOString(),
          startAt: makeStamp(3, 20, 0),
          dueDate: makeStamp(3, 21, 0),
          trackedMinutes: 0,
        },
      ],
    },
    {
      id: 'aiko-plan-english',
      title: 'Morning English Output Routine',
      description: 'Daily reps combining BBC shadowing, essays, and speaking club reflections.',
      status: 'in-progress',
      category: 'personal',
      tags: ['english', 'communication'],
      dueDate: writingPlanDue,
      tasks: [
        {
          id: 'aiko-plan-english-task-shadowing',
          title: 'BBC shadowing archive',
          description: 'Mark unfamiliar phrasing + mimic host cadence.',
          status: 'completed',
          priority: 'medium',
          createdAt: makeStamp(-28, 5, 30),
          startAt: makeStamp(-27, 5, 45),
          completedAt: addMinutes(makeStamp(-27, 5, 45), 60),
          dueDate: makeStamp(-26, 6, 0),
          trackedMinutes: 60,
        },
        {
          id: 'aiko-plan-english-task-writing',
          title: 'Prompted writing: resilience',
          description: 'Two-page reflection on study habits for the admissions essay.',
          status: 'completed',
          priority: 'high',
          createdAt: makeStamp(-15, 18, 0),
          startAt: makeStamp(-14, 19, 15),
          completedAt: addMinutes(makeStamp(-14, 19, 15), 85),
          dueDate: makeStamp(-13, 18, 0),
          trackedMinutes: 85,
        },
        {
          id: 'aiko-plan-english-task-speaking',
          title: 'Speaking club recap',
          description: 'Document pronunciation feedback & schedule follow-up drills.',
          status: 'completed',
          priority: 'medium',
          createdAt: makeStamp(-7, 17, 0),
          startAt: makeStamp(-6, 18, 0),
          completedAt: addMinutes(makeStamp(-6, 18, 0), 50),
          dueDate: makeStamp(-5, 19, 0),
          trackedMinutes: 50,
        },
        {
          id: 'aiko-plan-english-task-essay',
          title: 'Essay draft: “Why transfer?”',
          description: 'Polish intro & add concrete examples from robotics club.',
          status: 'in-progress',
          priority: 'high',
          createdAt: makeStamp(-2, 19, 0),
          startAt: makeStamp(-1, 21, 0),
          dueDate: makeStamp(2, 20, 0),
          trackedMinutes: 90,
        },
        {
          id: 'aiko-plan-english-task-reflection',
          title: 'Morning reflection log',
          description: 'Short voice memo summary converted to bullet list.',
          status: 'completed',
          priority: 'low',
          createdAt: makeStamp(0, 6, 20),
          startAt: makeStamp(0, 6, 45),
          completedAt: addMinutes(makeStamp(0, 6, 45), 25),
          dueDate: makeStamp(0, 7, 30),
          trackedMinutes: 25,
        },
      ],
    },
  ]

  return preparePlans(plans)
}

export function TaskManagerProvider({ children }) {
  const { user } = useAuth()
  const [plans, setPlans] = useState(() => (ENABLE_SAMPLE_PLANS ? buildDefaultPlans() : []))
  const lastUserIdRef = useRef(null)
  const authUserId = user?._id ?? user?.id ?? null
  const username = user?.username ?? ''

  useEffect(() => {
    if (!authUserId) {
      lastUserIdRef.current = null
      setPlans([])
      return
    }

    if (lastUserIdRef.current === authUserId) {
      return
    }

    lastUserIdRef.current = authUserId

    if (username === SHOWCASE_USERNAME) {
      setPlans(buildShowcasePlans())
    } else if (ENABLE_SAMPLE_PLANS) {
      setPlans(buildDefaultPlans())
    } else {
      setPlans([])
    }
  }, [authUserId, username])

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
    const trackedMinutes =
      typeof data.trackedMinutes === 'number' && data.trackedMinutes >= 0
        ? Math.round(data.trackedMinutes)
        : 0

    const task = {
      id: createId('task'),
      title: data.title,
      description: data.description ?? '',
      status,
      createdAt,
      startAt,
      dueDate,
      completedAt,
      trackedMinutes,
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

          let trackedMinutes = Number.isFinite(task.trackedMinutes) ? task.trackedMinutes : 0
          if (hasOwn(payload, 'trackedMinutes')) {
            const parsedMinutes = Number(payload.trackedMinutes)
            trackedMinutes =
              Number.isFinite(parsedMinutes) && parsedMinutes >= 0
                ? Math.round(parsedMinutes)
                : 0
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
            trackedMinutes,
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
