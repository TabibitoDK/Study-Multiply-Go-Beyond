import express from 'express'
import { StudyGroup, ChatMessage, Profile } from '../models/index.js'
import { authenticate } from '../middleware/auth.js'
import { validateObjectId } from '../middleware/validation.js'

const router = express.Router()

const toObjectIdString = value => {
  if (!value) return null
  if (typeof value === 'string') return value
  return value.toString()
}

function mapGroupResponse(group, lastMessage, profileMap = new Map()) {
  if (!group) return null
  const serialized = group.toObject ? group.toObject() : group
  const memberIds = Array.isArray(serialized.members)
    ? serialized.members.map(member => toObjectIdString(member)).filter(Boolean)
    : []

  let preview = null
  if (lastMessage) {
    const senderId = toObjectIdString(lastMessage.senderId)
    const senderProfile = profileMap.get(senderId)
    preview = {
      id: toObjectIdString(lastMessage._id || lastMessage.id),
      text: lastMessage.text || '',
      image: lastMessage.image || null,
      senderId,
      senderName: senderProfile?.name || senderProfile?.username || 'Someone',
      timestamp: lastMessage.createdAt || lastMessage.deliveredAt || new Date(),
    }
  }

  return {
    id: toObjectIdString(serialized._id),
    name: serialized.name,
    topic: serialized.topic || '',
    description: serialized.description || '',
    coverImage: serialized.coverImage || '',
    memberCount: memberIds.length,
    members: memberIds,
    lastMessage: preview,
    lastMessageAt: serialized.lastMessageAt,
  }
}

async function hydrateProfiles(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return new Map()
  }

  const uniqueIds = [...new Set(userIds.filter(Boolean))]
  const profiles = await Profile.find({ userId: { $in: uniqueIds } }).select(
    'userId name username profileImage',
  )

  const profileMap = new Map()
  profiles.forEach(profile => {
    profileMap.set(profile.userId.toString(), {
      id: profile.userId.toString(),
      name: profile.name || profile.username || '',
      username: profile.username || profile.name || '',
      profileImage: profile.profileImage || '',
    })
  })
  return profileMap
}

async function hydrateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return []
  }

  const senderIds = [
    ...new Set(messages.map(message => toObjectIdString(message.senderId)).filter(Boolean)),
  ]
  const profileMap = await hydrateProfiles(senderIds)

  return messages.map(message => {
    const senderId = toObjectIdString(message.senderId)
    const senderProfile = profileMap.get(senderId)
    return {
      id: toObjectIdString(message._id || message.id),
      senderId,
      senderName: senderProfile?.name || senderProfile?.username || 'Unknown',
      senderAvatar: senderProfile?.profileImage || '',
      text: message.text || '',
      image: message.image || null,
      timestamp: message.createdAt || message.deliveredAt || new Date(),
    }
  })
}

router.use(authenticate)

router.get('/', async (req, res, next) => {
  try {
    const groups = await StudyGroup.find({ members: req.user.id })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean()

    if (groups.length === 0) {
      return res.json([])
    }

    const groupIds = groups.map(group => group._id)
    const lastMessagesRaw = await ChatMessage.aggregate([
      {
        $match: {
          type: 'group',
          groupId: { $in: groupIds },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$groupId',
          doc: { $first: '$$ROOT' },
        },
      },
    ])

    const lastMessagesMap = new Map()
    const senderIds = new Set()
    lastMessagesRaw.forEach(entry => {
      if (entry?.doc) {
        lastMessagesMap.set(entry._id.toString(), entry.doc)
        senderIds.add(toObjectIdString(entry.doc.senderId))
      }
    })

    const profileMap = await hydrateProfiles([...senderIds])
    const response = groups.map(group =>
      mapGroupResponse(group, lastMessagesMap.get(group._id.toString()), profileMap),
    )

    res.json(response)
  } catch (error) {
    next(error)
  }
})

router.get('/:groupId/messages', validateObjectId('groupId'), async (req, res, next) => {
  try {
    const group = await StudyGroup.findById(req.params.groupId)
    if (!group) {
      return res.status(404).json({
        error: 'Group not found',
        message: 'The requested study group does not exist',
      })
    }

    const isMember = group.members.some(
      memberId => memberId.toString() === req.user.id.toString(),
    )
    if (!isMember) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You must join this group before viewing messages',
      })
    }

    const messages = await ChatMessage.find({
      type: 'group',
      groupId: group._id,
    })
      .sort({ createdAt: 1 })
      .lean()

    const hydrated = await hydrateMessages(messages)
    res.json({
      group: mapGroupResponse(group),
      messages: hydrated,
    })
  } catch (error) {
    next(error)
  }
})

router.post('/:groupId/messages', validateObjectId('groupId'), async (req, res, next) => {
  try {
    const { text = '', image = '' } = req.body ?? {}
    const trimmedText = typeof text === 'string' ? text.trim() : ''
    const hasImage = typeof image === 'string' && image.trim().length > 0

    if (!trimmedText && !hasImage) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Message text or an image is required',
      })
    }

    const group = await StudyGroup.findById(req.params.groupId)
    if (!group) {
      return res.status(404).json({
        error: 'Group not found',
        message: 'The requested study group does not exist',
      })
    }

    const isMember = group.members.some(
      memberId => memberId.toString() === req.user.id.toString(),
    )
    if (!isMember) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You must join this group before posting messages',
      })
    }

    const newMessage = await ChatMessage.create({
      type: 'group',
      groupId: group._id,
      participants: group.members,
      senderId: req.user.id,
      text: trimmedText,
      image: hasImage ? image : undefined,
    })

    group.lastMessageAt = new Date()
    await group.save()

    const [hydrated] = await hydrateMessages([newMessage])
    res.status(201).json(hydrated)
  } catch (error) {
    next(error)
  }
})

export default router
