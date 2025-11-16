import api from '../lib/api.js'

const normalizeId = value => {
  if (!value) return null
  if (typeof value === 'string') return value
  if (value._id) return value._id.toString()
  if (value.id) return value.id.toString()
  if (typeof value.toString === 'function') return value.toString()
  return null
}

const normalizePreview = preview => {
  if (!preview) return null
  return {
    id: normalizeId(preview.id),
    senderId: normalizeId(preview.senderId),
    senderName: preview.senderName || '',
    text: preview.text || '',
    image: preview.image || null,
    timestamp: preview.timestamp || new Date().toISOString(),
  }
}

export const normalizeGroup = group => {
  if (!group) return null
  const members = Array.isArray(group.members)
    ? group.members.map(member => normalizeId(member)).filter(Boolean)
    : []
  const coverImage = group.coverImage || group.image || ''

  return {
    id: normalizeId(group.id) || normalizeId(group._id),
    name: group.name || 'Study Group',
    topic: group.topic || '',
    description: group.description || '',
    coverImage,
    image: coverImage,
    memberCount: typeof group.memberCount === 'number' ? group.memberCount : members.length,
    members,
    lastMessage: normalizePreview(group.lastMessage),
    lastMessageAt: group.lastMessageAt || group.lastMessage?.timestamp || null,
  }
}

const dedupeGroups = groups => {
  if (!Array.isArray(groups)) return []
  const seen = new Set()
  return groups.filter(group => {
    if (!group) return false
    const normalizedName = (group.name || '').trim().toLowerCase()
    const normalizedTopic = (group.topic || '').trim().toLowerCase()
    const fallbackKey = `${normalizedName}::${normalizedTopic}`
    const keys = [
      group.id || null,
      normalizedName ? `name::${normalizedName}` : null,
      fallbackKey || null,
    ].filter(Boolean)

    if (keys.some(key => seen.has(key))) {
      return false
    }

    keys.forEach(key => seen.add(key))
    return true
  })
}

export const groupService = {
  getMyGroups: async () => {
    try {
      const response = await api.get('/study-groups')
      const list = Array.isArray(response) ? response : []
      const normalized = list.map(normalizeGroup).filter(Boolean)
      return dedupeGroups(normalized)
    } catch (error) {
      console.error('Error fetching study groups:', error)
      throw error
    }
  },
}

export default groupService
