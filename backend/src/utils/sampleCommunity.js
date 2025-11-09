import { User, Profile, StudyGroup, ChatMessage } from '../models/index.js'

const SHOWCASE_USERNAMES = [
  'aiko_hennyuu',
  'haruto_study',
  'miyu_gakushu',
  'ren_math',
  'sora_english',
]

const ENGLISH_GROUP = {
  name: 'English Presentation Circle',
  topic: 'Weekly English presentation practice',
  coverImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4',
  description:
    'A small accountability pod where we rehearse English presentations, trade comfort tips, and keep each other confident before showcase day.',
}

const GROUP_STORY = [
  {
    username: 'sora_english',
    text: 'Morning team! I timed my opener twice and it still runs 90 seconds. Anyone else trimming their intro today?',
  },
  {
    username: 'haruto_study',
    text: "Yep. I record a voice memo while walking around the room. Hearing the pauses tells me where to shorten transitions between sections.",
  },
  {
    username: 'aiko_hennyuu',
    text: "Hearing you all talk about rehearsals honestly makes me nervous. My hands shake as soon as I picture the classroom.",
  },
  {
    username: 'miyu_gakushu',
    text: "Let's help you map the exact first minute. Breathe in for 4, plant your feet, then tell the story about the robotics club breakdown. We'll rehearse it together tonight.",
  },
  {
    username: 'sora_english',
    text: 'Remember, we are sharing how we prepare, not trying to sound perfect. I keep sticky notes on my laptop reminding me to smile between sections.',
  },
  {
    username: 'haruto_study',
    text: 'Aiko, you already know your material. I will DM you my slide outline—steal any transition lines you like and I will ping you after dinner for a quick dry run.',
  },
]

const DIRECT_THREAD = [
  {
    username: 'haruto_study',
    text: 'Sent you my “problem → approach → result” transitions. Check slide 3 for the calm breathing cue we talked about.',
  },
  {
    username: 'aiko_hennyuu',
    text: 'Thank you! I copied your “walk to the audience” reminder. Practicing with it now.',
  },
  {
    username: 'haruto_study',
    text: 'Ping me whenever you want a two-minute rehearsal. I am online until midnight.',
  },
]

const toIdString = value => (typeof value === 'string' ? value : value?.toString())

function ensureArray(list) {
  if (Array.isArray(list)) {
    return list
  }
  return []
}

function pushObjectId(list, value) {
  if (!value) return false
  const target = toIdString(value)
  const exists = ensureArray(list).some(item => toIdString(item) === target)
  if (exists) {
    return false
  }
  list.push(value)
  return true
}

async function ensureFollow(sourceProfile, targetProfile) {
  sourceProfile.following = ensureArray(sourceProfile.following)
  targetProfile.followers = ensureArray(targetProfile.followers)
  const updates = []
  if (pushObjectId(sourceProfile.following, targetProfile.userId)) {
    updates.push(sourceProfile.save())
  }
  if (pushObjectId(targetProfile.followers, sourceProfile.userId)) {
    updates.push(targetProfile.save())
  }
  await Promise.all(updates)
}

async function connectFriends(profileA, profileB) {
  await Promise.all([ensureFollow(profileA, profileB), ensureFollow(profileB, profileA)])
}

async function ensureFriendNetwork(profileMap) {
  const pairs = [
    ['aiko_hennyuu', 'haruto_study'],
    ['aiko_hennyuu', 'miyu_gakushu'],
    ['aiko_hennyuu', 'sora_english'],
    ['aiko_hennyuu', 'ren_math'],
  ]

  for (const [left, right] of pairs) {
    const profileA = profileMap.get(left)
    const profileB = profileMap.get(right)
    if (!profileA || !profileB) continue
    await connectFriends(profileA, profileB)
  }
}

function makeConversationKey(a, b) {
  const [first, second] = [toIdString(a), toIdString(b)].sort()
  return `${first}:${second}`
}

async function seedGroupConversation(groupDoc, userMap) {
  const existingCount = await ChatMessage.countDocuments({
    type: 'group',
    groupId: groupDoc._id,
  })
  if (existingCount > 0) {
    return
  }

  for (const entry of GROUP_STORY) {
    const user = userMap.get(entry.username)
    if (!user) continue
    await ChatMessage.create({
      type: 'group',
      groupId: groupDoc._id,
      participants: groupDoc.members,
      senderId: user._id,
      text: entry.text,
    })
  }

  groupDoc.lastMessageAt = new Date()
  await groupDoc.save()
}

async function seedDirectConversation(userA, userB) {
  const key = makeConversationKey(userA._id, userB._id)
  const existing = await ChatMessage.countDocuments({
    type: 'direct',
    conversationKey: key,
  })
  if (existing > 0) {
    return
  }

  for (const entry of DIRECT_THREAD) {
    const sender = entry.username === userA.username ? userA : userB
    await ChatMessage.create({
      type: 'direct',
      conversationKey: key,
      participants: [userA._id, userB._id],
      senderId: sender._id,
      text: entry.text,
    })
  }
}

export async function ensureCommunityShowcase() {
  try {
    const users = await User.find({ username: { $in: SHOWCASE_USERNAMES } })
    if (users.length === 0) {
      console.warn('[seed] No showcase users found, skipping community stories')
      return
    }

    const userMap = new Map(users.map(user => [user.username, user]))
    const profiles = await Profile.find({ userId: { $in: users.map(user => user._id) } })
    const profileMap = new Map(profiles.map(profile => [profile.username, profile]))

    await ensureFriendNetwork(profileMap)

    const aiko = userMap.get('aiko_hennyuu')
    const haruto = userMap.get('haruto_study')
    const miyu = userMap.get('miyu_gakushu')
    const ren = userMap.get('ren_math')
    const sora = userMap.get('sora_english')

    if (!aiko) {
      console.warn('[seed] Missing aiko_hennyuu user, cannot build presentation group')
      return
    }

    const memberIds = [aiko, haruto, miyu, ren, sora]
      .filter(Boolean)
      .map(user => user._id)

    const group = await StudyGroup.findOneAndUpdate(
      { name: ENGLISH_GROUP.name },
      {
        $setOnInsert: {
          topic: ENGLISH_GROUP.topic,
          description: ENGLISH_GROUP.description,
          coverImage: ENGLISH_GROUP.coverImage,
          createdBy: aiko._id,
        },
        $set: {
          members: memberIds,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    )

    const missingMembers = memberIds.filter(
      id => !group.members.some(memberId => memberId.toString() === id.toString()),
    )
    if (missingMembers.length > 0) {
      group.members = [...group.members, ...missingMembers]
      await group.save()
    }

    await seedGroupConversation(group, userMap)

    if (haruto) {
      await seedDirectConversation(aiko, haruto)
    }
  } catch (error) {
    console.error('[seed] Failed to set up community showcase data:', error)
  }
}

export default ensureCommunityShowcase
