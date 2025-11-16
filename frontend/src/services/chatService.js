import api from '../lib/api.js'
import { normalizeGroup } from './groupService.js'

const normalizeId = value => {
  if (!value) return null
  if (typeof value === 'string') return value
  if (value._id) return value._id.toString()
  if (value.id) return value.id.toString()
  if (typeof value.toString === 'function') return value.toString()
  return null
}

const isObjectId = value => typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value.trim())

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

const DIRECT_THREADS_KEY = 'guest_direct_threads'
const GROUP_THREADS_KEY = 'guest_group_threads'

const readStoredThreads = key => {
  if (!isBrowser) {
    return {}
  }
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : {}
  } catch (error) {
    console.warn(`Failed to read ${key} from storage`, error)
    return {}
  }
}

const writeStoredThreads = (key, value) => {
  if (!isBrowser) {
    return
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn(`Failed to write ${key} to storage`, error)
  }
}

const getStoredMessages = (key, threadId) => {
  const store = readStoredThreads(key)
  return Array.isArray(store[threadId]) ? store[threadId] : []
}

const appendStoredMessage = (key, threadId, message) => {
  const store = readStoredThreads(key)
  const list = Array.isArray(store[threadId]) ? store[threadId] : []
  const updated = [...list, message]
  store[threadId] = updated
  writeStoredThreads(key, store)
  return updated
}

const normalizeMessage = message => {
  if (!message) return null
  return {
    id: normalizeId(message.id) || normalizeId(message._id),
    senderId: normalizeId(message.senderId),
    senderName: message.senderName || '',
    senderAvatar: message.senderAvatar || '',
    text: message.text || '',
    image: message.image || null,
    timestamp: message.timestamp || new Date().toISOString(),
  }
}

const normalizeMessageList = list => {
  if (!Array.isArray(list)) return []
  return list.map(normalizeMessage).filter(Boolean)
}

const localDirectThreads = new Map()
const localGroupThreads = new Map()

const ensureLocalThread = (collection, id) => {
  const normalizedId = String(id)
  if (!collection.has(normalizedId)) {
    collection.set(normalizedId, [])
  }
  return collection.get(normalizedId)
}

const createLocalMessage = (payload = {}, meta = {}) => ({
  id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  senderId: meta.senderId || 'local-user',
  senderName: meta.senderName || 'You',
  senderAvatar: meta.senderAvatar || '',
  text: payload.text || '',
  image: payload.image || null,
  timestamp: new Date().toISOString(),
})

export const chatService = {
  getDirectThread: async friendId => {
    if (!friendId) {
      return { friend: null, messages: [] }
    }
    const normalizedId = String(friendId)
    if (!isObjectId(normalizedId)) {
      const localMessages =
        localDirectThreads.get(normalizedId) ||
        getStoredMessages(DIRECT_THREADS_KEY, normalizedId)
      localDirectThreads.set(normalizedId, localMessages)
      return {
        friend: { id: normalizedId },
        messages: [...localMessages],
      }
    }
    try {
      const response = await api.get(`/chats/direct/${normalizedId}/messages`)
      return {
        friend: response?.friend ?? null,
        messages: normalizeMessageList(response?.messages),
      }
    } catch (error) {
      console.error('Error fetching direct messages:', error)
      throw error
    }
  },

  sendDirectMessage: async (friendId, payload, meta = {}) => {
    if (!friendId) throw new Error('Friend ID is required')
    const normalizedId = String(friendId)
    if (!isObjectId(normalizedId)) {
      const localMessages = ensureLocalThread(localDirectThreads, normalizedId)
      const message = createLocalMessage(payload, meta)
      const updated = [...localMessages, message]
      localDirectThreads.set(normalizedId, updated)
      appendStoredMessage(DIRECT_THREADS_KEY, normalizedId, message)
      return message
    }
    try {
      const response = await api.post(`/chats/direct/${normalizedId}/messages`, payload)
      return normalizeMessage(response)
    } catch (error) {
      console.error('Error sending direct message:', error)
      throw error
    }
  },

  getGroupMessages: async groupId => {
    if (!groupId) {
      return { group: null, messages: [] }
    }
    const normalizedId = String(groupId)
    if (!isObjectId(normalizedId)) {
      const localMessages =
        localGroupThreads.get(normalizedId) ||
        getStoredMessages(GROUP_THREADS_KEY, normalizedId)
      localGroupThreads.set(normalizedId, localMessages)
      return {
        group: { id: normalizedId },
        messages: [...localMessages],
      }
    }
    try {
      const response = await api.get(`/study-groups/${normalizedId}/messages`)
      return {
        group: normalizeGroup(response?.group),
        messages: normalizeMessageList(response?.messages),
      }
    } catch (error) {
      console.error('Error fetching group messages:', error)
      throw error
    }
  },

  sendGroupMessage: async (groupId, payload, meta = {}) => {
    if (!groupId) throw new Error('Group ID is required')
    const normalizedId = String(groupId)
    if (!isObjectId(normalizedId)) {
      const localMessages = ensureLocalThread(localGroupThreads, normalizedId)
      const message = createLocalMessage(payload, meta)
      const updated = [...localMessages, message]
      localGroupThreads.set(normalizedId, updated)
      appendStoredMessage(GROUP_THREADS_KEY, normalizedId, message)
      return message
    }
    try {
      const response = await api.post(`/study-groups/${normalizedId}/messages`, payload)
      return normalizeMessage(response)
    } catch (error) {
      console.error('Error sending group message:', error)
      throw error
    }
  },
}

export default chatService
