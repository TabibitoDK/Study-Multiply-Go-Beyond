import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import { useAuth } from './AuthContext.jsx'
import taskPlanService from '../services/taskPlanService.js'

const TaskManagerContext = createContext(null)
const ENABLE_SAMPLE_PLANS = false
const SHOWCASE_USERNAME = 'aiko_hennyuu'

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

const normalizePlanId = plan => {
  if (!plan) return createId('lt')
  if (plan.id) return String(plan.id)
  if (plan._id) return String(plan._id)
  if (plan.planId) return String(plan.planId)
  return createId('lt')
}

const normalizeUserId = userRef => {
  if (!userRef) return null
  if (typeof userRef === 'string') return String(userRef)
  if (typeof userRef === 'object') {
    if (userRef._id) return String(userRef._id)
    if (userRef.id) return String(userRef.id)
    if (userRef.userId) return String(userRef.userId)
  }
  return null
}

const normalizeTaskRecord = task => {
  if (!task) return null
  const taskId = String(task.id || task._id || createId('task'))
  const createdAt = toIsoOrNull(task.createdAt) ?? null
  const startAt = toIsoOrNull(task.startAt) ?? createdAt
  const dueDate = toIsoOrNull(task.dueDate) ?? startAt ?? createdAt
  const completedAt = toIsoOrNull(task.completedAt) ?? null
  const trackedMinutes =
    typeof task.trackedMinutes === 'number' && task.trackedMinutes >= 0
      ? Math.round(task.trackedMinutes)
      : 0

  return {
    ...task,
    id: taskId,
    _id: task._id || taskId,
    title: task.title ?? '',
    description: task.description ?? '',
    status: task.status ?? 'not-started',
    createdAt,
    startAt,
    dueDate,
    completedAt,
    trackedMinutes,
  }
}

const buildTaskUpdatePayload = updates => {
  if (!updates) {
    return {}
  }

  const payload = {}

  if (hasOwn(updates, 'title')) {
    payload.title = updates.title ?? ''
  }

  if (hasOwn(updates, 'description')) {
    payload.description = updates.description ?? ''
  }

  if (hasOwn(updates, 'status')) {
    payload.status = updates.status ?? 'not-started'
  }

  if (hasOwn(updates, 'priority')) {
    payload.priority = updates.priority ?? 'medium'
  }

  if (hasOwn(updates, 'createdAt')) {
    payload.createdAt = updates.createdAt === null ? null : toIsoOrNull(updates.createdAt)
  }

  if (hasOwn(updates, 'startAt')) {
    payload.startAt = updates.startAt === null ? null : toIsoOrNull(updates.startAt)
  }

  if (hasOwn(updates, 'dueDate')) {
    payload.dueDate = updates.dueDate === null ? null : toIsoOrNull(updates.dueDate)
  }

  if (hasOwn(updates, 'completedAt')) {
    payload.completedAt = updates.completedAt === null ? null : toIsoOrNull(updates.completedAt)
  }

  if (hasOwn(updates, 'trackedMinutes')) {
    const parsedMinutes = Number(updates.trackedMinutes)
    payload.trackedMinutes =
      Number.isFinite(parsedMinutes) && parsedMinutes >= 0 ? Math.round(parsedMinutes) : 0
  }

  return payload
}

function preparePlans(plans) {
  return (plans ?? []).map(plan => {
    const normalizedTasks = Array.isArray(plan.tasks)
      ? plan.tasks.map(normalizeTaskRecord).filter(Boolean)
      : []
    const planId = normalizePlanId(plan)
    const userId = normalizeUserId(plan.userId)
    return {
      ...plan,
      id: planId,
      _id: plan._id || planId,
      userId: userId ?? null,
      tasks: normalizedTasks,
      dueDate: plan.dueDate ?? computePlanDueDate(normalizedTasks, null),
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
  const presentationPlanDue = today
    .add(5, 'day')
    .hour(14)
    .minute(0)
    .second(0)
    .millisecond(0)
    .toISOString()

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
    {
      id: 'aiko-plan-presentations',
      title: 'Knockout Presentation Sprint',
      description: 'Layered drills from Knockout Presentations to keep every story arc sharp.',
      status: 'in-progress',
      category: 'communication',
      tags: ['presentation', 'speaking', 'knockout'],
      dueDate: presentationPlanDue,
      tasks: [
        {
          id: 'aiko-plan-presentations-task-cold-open',
          title: 'Cold open experimentation',
          description: 'Record three bold hooks and score them for surprise vs clarity.',
          status: 'completed',
          priority: 'medium',
          createdAt: makeStamp(-122, 7, 0),
          startAt: makeStamp(-120, 7, 15),
          completedAt: addMinutes(makeStamp(-120, 7, 15), 140),
          dueDate: makeStamp(-119, 8, 0),
          trackedMinutes: 140,
        },
        {
          id: 'aiko-plan-presentations-task-storyboard',
          title: 'Storyboard the promise',
          description: 'Map each slide to audience questions using Knockout cues.',
          status: 'completed',
          priority: 'high',
          createdAt: makeStamp(-100, 6, 0),
          startAt: makeStamp(-97, 6, 45),
          completedAt: addMinutes(makeStamp(-97, 6, 45), 190),
          dueDate: makeStamp(-96, 9, 0),
          trackedMinutes: 190,
        },
        {
          id: 'aiko-plan-presentations-task-slide-audit',
          title: 'Slide audit with mentors',
          description: 'Cut clutter + add cues for gestures per Knockout checklist.',
          status: 'completed',
          priority: 'medium',
          createdAt: makeStamp(-70, 8, 30),
          startAt: makeStamp(-64, 9, 15),
          completedAt: addMinutes(makeStamp(-64, 9, 15), 165),
          dueDate: makeStamp(-63, 10, 0),
          trackedMinutes: 165,
        },
        {
          id: 'aiko-plan-presentations-task-feedback-loop',
          title: 'Feedback lightning round',
          description: 'Host 15-min peer reviews focusing on pace + gesture cues.',
          status: 'completed',
          priority: 'high',
          createdAt: makeStamp(-45, 18, 0),
          startAt: makeStamp(-38, 18, 30),
          completedAt: addMinutes(makeStamp(-38, 18, 30), 175),
          dueDate: makeStamp(-37, 20, 0),
          trackedMinutes: 175,
        },
        {
          id: 'aiko-plan-presentations-task-weekend-rehearsal',
          title: 'Weekend dress rehearsal',
          description: 'Full run-through with recorded Q&A banks.',
          status: 'completed',
          priority: 'medium',
          createdAt: makeStamp(-18, 8, 0),
          startAt: makeStamp(-12, 9, 0),
          completedAt: addMinutes(makeStamp(-12, 9, 0), 130),
          dueDate: makeStamp(-11, 11, 0),
          trackedMinutes: 130,
        },
        {
          id: 'aiko-plan-presentations-task-spotlight',
          title: 'Spotlight clarity drill',
          description: 'Rebuild slide 3 story with only images and questions.',
          status: 'in-progress',
          priority: 'high',
          createdAt: makeStamp(-8, 7, 0),
          startAt: makeStamp(-5, 7, 30),
          dueDate: makeStamp(-3, 9, 0),
          trackedMinutes: 85,
        },
        {
          id: 'aiko-plan-presentations-task-live-loop',
          title: 'Live loop rehearsal',
          description: 'Today’s loop: opener + objection handling with timer.',
          status: 'in-progress',
          priority: 'high',
          createdAt: makeStamp(0, 10, 30),
          startAt: makeStamp(0, 11, 5),
          dueDate: makeStamp(0, 13, 30),
          trackedMinutes: 55,
        },
        {
          id: 'aiko-plan-presentations-task-qa-bank',
          title: 'Audience Q&A bank',
          description: 'Research 12 tough follow-ups and craft punchy closes.',
          status: 'not-started',
          priority: 'medium',
          createdAt: today.toISOString(),
          startAt: makeStamp(2, 19, 0),
          dueDate: makeStamp(4, 20, 30),
          trackedMinutes: 0,
        },
      ],
    },
  ]

  return preparePlans(plans)
}

export function TaskManagerProvider({ children }) {
  const { user } = useAuth()
  const [plans, setPlans] = useState(() => (ENABLE_SAMPLE_PLANS ? buildDefaultPlans() : []))
  const plansRef = useRef(plans)
  const authUserId = user?._id ?? user?.id ?? null
  const username = user?.username ?? ''

  useEffect(() => {
    plansRef.current = plans
  }, [plans])

  useEffect(() => {
    let cancelled = false

    const applyFallbackPlans = () => {
      if (username === SHOWCASE_USERNAME) {
        setPlans(buildShowcasePlans())
        return
      }
      if (ENABLE_SAMPLE_PLANS) {
        setPlans(buildDefaultPlans())
      } else {
        setPlans([])
      }
    }

    if (!authUserId) {
      applyFallbackPlans()
      return
    }

    if (username === SHOWCASE_USERNAME) {
      setPlans(buildShowcasePlans())
      return
    }

    const loadPlans = async () => {
      try {
        const response = await taskPlanService.list({ page: 1, limit: 100 })
        if (!cancelled) {
          setPlans(preparePlans(response))
        }
      } catch (error) {
        console.error('Failed to load task plans', error)
        if (!cancelled) {
          applyFallbackPlans()
        }
      }
    }

    loadPlans()

    return () => {
      cancelled = true
    }
  }, [authUserId, username])

  const addPlan = useCallback(
    async ({ title, description, dueDate, category = 'academic', tags = [] }) => {
      const payload = {
        title: (title || '').trim() || 'Untitled plan',
        description: description?.trim() || '',
        dueDate: toIsoOrNull(dueDate),
        status: 'not-started',
        category,
        tags: Array.isArray(tags) ? tags : [],
      }

      try {
        const createdPlan = await taskPlanService.createPlan(payload)
        const normalized = preparePlans([createdPlan])[0]
        if (!normalized) {
          throw new Error('Task plan payload was empty')
        }
        setPlans(prev => {
          const withoutExisting = prev.filter(plan => plan.id !== normalized.id)
          return [...withoutExisting, normalized]
        })
        return normalized
      } catch (error) {
        console.error('Failed to create task plan', error)
        throw error
      }
    },
    [],
  )

  const updatePlanStatus = useCallback(async (planId, status) => {
    if (!planId) {
      throw new Error('Plan id is required to update status')
    }
    try {
      const updatedPlan = await taskPlanService.update(planId, { status })
      const normalized = preparePlans([updatedPlan])[0]
      setPlans(prev =>
        prev.map(plan => (plan.id === planId && normalized ? { ...plan, ...normalized } : plan)),
      )
      return normalized ?? null
    } catch (error) {
      console.error('Failed to update task plan status', error)
      throw error
    }
  }, [])

  const addTask = useCallback(
    async (planId, data) => {
      if (!planId) {
        throw new Error('Plan id is required to add a task')
      }

      const creationPayload = {
        title: (data.title || '').trim() || 'Untitled task',
        description: data.description?.trim() || '',
        priority: data.priority || 'medium',
        dueDate: toIsoOrNull(data.dueDate),
        estimatedHours: data.estimatedHours ?? 0,
        tags: Array.isArray(data.tags) ? data.tags : [],
        dependencies: Array.isArray(data.dependencies) ? data.dependencies : [],
        relatedBookId: data.relatedBookId ?? null,
      }

      try {
        const createdTask = await taskPlanService.addTask(planId, creationPayload)
        const patch = {
          status: data.status ?? 'not-started',
          createdAt: data.createdAt,
          startAt: data.startAt,
          dueDate: data.dueDate,
          completedAt: data.completedAt,
          trackedMinutes: data.trackedMinutes,
        }
        if (patch.status === 'completed' && !patch.completedAt) {
          patch.completedAt = dayjs().toISOString()
        }
        const normalizedPatch = buildTaskUpdatePayload(patch)

        let serverTask = createdTask
        if (Object.keys(normalizedPatch).length > 0) {
          const updated = await taskPlanService.updateTask(planId, createdTask.id, normalizedPatch)
          serverTask = updated
        }

        const normalizedTask = normalizeTaskRecord(serverTask)
        setPlans(prev =>
          prev.map(plan => {
            if (plan.id !== planId) {
              return plan
            }
            const nextTasks = [normalizedTask, ...(plan.tasks ?? [])]
            return {
              ...plan,
              tasks: nextTasks,
              dueDate: computePlanDueDate(nextTasks, plan.dueDate ?? normalizedTask.dueDate),
            }
          }),
        )

        return normalizedTask
      } catch (error) {
        console.error('Failed to add task to plan', error)
        throw error
      }
    },
    [],
  )

  const updateTask = useCallback(
    async (planId, taskId, updates) => {
      if (!planId || !taskId) {
        throw new Error('Plan id and task id are required to update a task')
      }

      const payload = buildTaskUpdatePayload(updates)

      if (!Object.keys(payload).length) {
        const currentPlan = plansRef.current?.find(plan => plan.id === planId)
        return currentPlan?.tasks?.find(task => task.id === taskId) ?? null
      }

      try {
        const response = await taskPlanService.updateTask(planId, taskId, payload)
        const normalizedTask = normalizeTaskRecord(response)
        setPlans(prev =>
          prev.map(plan => {
            if (plan.id !== planId) {
              return plan
            }
            const nextTasks = (plan.tasks ?? []).map(task =>
              task.id === taskId ? normalizedTask : task,
            )
            return {
              ...plan,
              tasks: nextTasks,
              dueDate: computePlanDueDate(nextTasks, plan.dueDate ?? normalizedTask.dueDate),
            }
          }),
        )
        return normalizedTask
      } catch (error) {
        console.error('Failed to update task', error)
        throw error
      }
    },
    [],
  )

  const updateTaskStatus = useCallback(
    async (planId, taskId, status) => {
      if (!planId || !taskId) {
        throw new Error('Plan id and task id are required to update task status')
      }
      const currentPlans = plansRef.current || []
      const targetPlan = currentPlans.find(plan => plan.id === planId)
      const previousTask =
        targetPlan?.tasks?.find(task => task.id === taskId) ?? null
      const nextTask = await updateTask(planId, taskId, {
        status,
        completedAt: status === 'completed' ? dayjs().toISOString() : null,
      })

      return { previousTask, nextTask }
    },
    [updateTask],
  )

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
