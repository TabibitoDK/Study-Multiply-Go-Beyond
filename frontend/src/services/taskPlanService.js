import api from '../lib/api.js'

const toQueryString = params => {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    if (Array.isArray(value)) {
      value.filter(Boolean).forEach(entry => searchParams.append(key, entry))
      return
    }

    searchParams.set(key, value)
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

const ensureId = (value, label) => {
  if (!value) {
    throw new Error(`${label || 'Identifier'} is required`)
  }
  return value
}

export const taskPlanService = {
  async list(params = {}) {
    const {
      page = 1,
      limit = 50,
      status,
      category,
      tags,
      isPublic,
    } = params

    const query = toQueryString({ page, limit, status, category, tags, isPublic })
    const response = await api.get(`/task-plans${query}`)
    return response?.taskPlans ?? response ?? []
  },

  async create(planData) {
    const response = await api.post('/task-plans', planData)
    return response?.taskPlan ?? response
  },

  async createPlan(planData) {
    return this.create(planData)
  },

  async update(planId, payload) {
    const safePlanId = ensureId(planId, 'Task plan id')
    const response = await api.put(`/task-plans/${safePlanId}`, payload)
    return response?.taskPlan ?? response
  },

  async remove(planId) {
    const safePlanId = ensureId(planId, 'Task plan id')
    return api.delete(`/task-plans/${safePlanId}`)
  },

  async addTask(planId, taskData) {
    const safePlanId = ensureId(planId, 'Task plan id')
    const response = await api.post(`/task-plans/${safePlanId}/tasks`, taskData)
    return response?.task ?? response
  },

  async updateTask(planId, taskId, taskData) {
    const safePlanId = ensureId(planId, 'Task plan id')
    const safeTaskId = ensureId(taskId, 'Task id')
    const response = await api.put(`/task-plans/${safePlanId}/tasks/${safeTaskId}`, taskData)
    return response?.task ?? response
  },
}

export default taskPlanService
