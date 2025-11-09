import express from 'express'
import { ChatMessage, Profile, User } from '../models/index.js'
import { authenticate } from '../middleware/auth.js'
import { validateObjectId } from '../middleware/validation.js'

const router = express.Router()

const normalizeId = value => {
  if (!value) return null
  if (typeof value === 'string') return value
  return value.toString()
}

const makeConversationKey = (a, b) => {
  const [first, second] = [normalizeId(a), normalizeId(b)].sort()
  return `${first}:${second}`
}

async function fetchProfileMap(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return new Map()
  }

  const uniqueIds = [...new Set(userIds.filter(Boolean))]
  const profiles = await Profile.find({ userId: { $in: uniqueIds } }).select(
    'userId name username profileImage',
  )

  const map = new Map()
  profiles.forEach(profile => {
    map.set(profile.userId.toString(), {
      id: profile.userId.toString(),
      name: profile.name || profile.username || '',
      username: profile.username || profile.name || '',
      profileImage: profile.profileImage || '',
    })
  })
  return map
}

async function serializeMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return []
  }

  const senderIds = [
    ...new Set(messages.map(message => normalizeId(message.senderId)).filter(Boolean)),
  ]
  const profileMap = await fetchProfileMap(senderIds)

  return messages.map(message => {
    const senderId = normalizeId(message.senderId)
    const senderProfile = profileMap.get(senderId)
    return {
      id: normalizeId(message._id || message.id),
      senderId,
      senderName: senderProfile?.name || senderProfile?.username || 'Unknown',
      senderAvatar: senderProfile?.profileImage || '',
      text: message.text || '',
      image: message.image || null,
      timestamp: message.createdAt || message.deliveredAt || new Date(),
    }
  })
}

async function ensureFriendship(currentProfile, targetProfile, targetUserId) {
  if (!currentProfile || !targetProfile) {
    return false
  }

  const targetId = normalizeId(targetUserId)
  const currentId = currentProfile.userId.toString()
  const followsTarget =
    currentProfile.following?.some(id => normalizeId(id) === targetId) ?? false
  const targetFollowsCurrent =
    targetProfile.following?.some(id => normalizeId(id) === currentId) ?? false
  const isFollower =
    currentProfile.followers?.some(id => normalizeId(id) === targetId) ?? false
  const isFollowedByTarget =
    targetProfile.followers?.some(id => normalizeId(id) === currentId) ?? false

  return followsTarget || targetFollowsCurrent || isFollower || isFollowedByTarget
}

router.use(authenticate)

router.get(
  '/direct/:friendId/messages',
  validateObjectId('friendId'),
  async (req, res, next) => {
    try {
      const friendId = req.params.friendId
      if (friendId === req.user.id.toString()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'You cannot start a chat with yourself',
        })
      }

      const [friendUser, currentProfile, friendProfile] = await Promise.all([
        User.findById(friendId),
        Profile.findOne({ userId: req.user.id }),
        Profile.findOne({ userId: friendId }),
      ])

      if (!friendUser || !friendProfile || !currentProfile) {
        return res.status(404).json({
          error: 'Profile not found',
          message: 'One of the participants is missing a profile',
        })
      }

      const allowed = await ensureFriendship(currentProfile, friendProfile, friendId)
      if (!allowed) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only chat with users that are connected to you',
        })
      }

      const conversationKey = makeConversationKey(req.user.id, friendId)
      const messages = await ChatMessage.find({
        type: 'direct',
        conversationKey,
      })
        .sort({ createdAt: 1 })
        .lean()

      const payload = await serializeMessages(messages)
      res.json({
        friend: {
          id: friendProfile.userId.toString(),
          name: friendProfile.name || friendProfile.username || friendUser.username,
          username: friendProfile.username || friendUser.username,
          profileImage: friendProfile.profileImage || '',
        },
        messages: payload,
      })
    } catch (error) {
      next(error)
    }
  },
)

router.post(
  '/direct/:friendId/messages',
  validateObjectId('friendId'),
  async (req, res, next) => {
    try {
      const friendId = req.params.friendId
      const { text = '', image = '' } = req.body ?? {}
      const trimmedText = typeof text === 'string' ? text.trim() : ''
      const hasImage = typeof image === 'string' && image.trim().length > 0

      if (!trimmedText && !hasImage) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Message text or an image is required',
        })
      }

      const [friendUser, currentProfile, friendProfile] = await Promise.all([
        User.findById(friendId),
        Profile.findOne({ userId: req.user.id }),
        Profile.findOne({ userId: friendId }),
      ])

      if (!friendUser || !friendProfile || !currentProfile) {
        return res.status(404).json({
          error: 'Profile not found',
          message: 'One of the participants is missing a profile',
        })
      }

      const allowed = await ensureFriendship(currentProfile, friendProfile, friendId)
      if (!allowed) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only chat with users that are connected to you',
        })
      }

      const conversationKey = makeConversationKey(req.user.id, friendId)
      const message = await ChatMessage.create({
        type: 'direct',
        conversationKey,
        participants: [req.user.id, friendId],
        senderId: req.user.id,
        text: trimmedText,
        image: hasImage ? image : undefined,
      })

      const [serialized] = await serializeMessages([message])
      res.status(201).json(serialized)
    } catch (error) {
      next(error)
    }
  },
)

export default router
