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

export const chatService = {
  getDirectThread: async friendId => {
    if (!friendId) return { friend: null, messages: [] }
    try {
      const response = await api.get(`/chats/direct/${friendId}/messages`)
      return {
        friend: response?.friend ?? null,
        messages: normalizeMessageList(response?.messages),
      }
    } catch (error) {
      console.error('Error fetching direct messages:', error)
      throw error
    }
  },

  sendDirectMessage: async (friendId, payload) => {
    if (!friendId) throw new Error('Friend ID is required')
    try {
      const response = await api.post(`/chats/direct/${friendId}/messages`, payload)
      return normalizeMessage(response)
    } catch (error) {
      console.error('Error sending direct message:', error)
      throw error
    }
  },

  getGroupMessages: async groupId => {
    if (!groupId) return { group: null, messages: [] }
    try {
      const response = await api.get(`/study-groups/${groupId}/messages`)
      return {
        group: normalizeGroup(response?.group),
        messages: normalizeMessageList(response?.messages),
      }
    } catch (error) {
      console.error('Error fetching group messages:', error)
      throw error
    }
  },

  sendGroupMessage: async (groupId, payload) => {
    if (!groupId) throw new Error('Group ID is required')
    try {
      const response = await api.post(`/study-groups/${groupId}/messages`, payload)
      return normalizeMessage(response)
    } catch (error) {
      console.error('Error sending group message:', error)
      throw error
    }
  },
}

export default chatService
