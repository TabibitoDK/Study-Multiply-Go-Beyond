import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { Book, Post, Tag, User } from '../models/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.resolve(__dirname, '../../..', 'frontend', 'src', 'data')
let isSeedingFrontendData = false
let demoDataReady = false

const COLOR_PALETTE = [
  '#2563eb',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#ef4444',
  '#14b8a6',
  '#f97316',
  '#6366f1',
]

function normalizeString(value) {
  if (typeof value !== 'string') return ''
  return value.trim()
}

async function readJson(filename) {
  try {
    const fullPath = path.join(DATA_DIR, filename)
    const raw = await fs.readFile(fullPath, 'utf-8')
    return JSON.parse(raw)
  } catch (error) {
    console.warn(`[seed] Unable to read ${filename}: ${error.message}`)
    return null
  }
}

function pickColor(name) {
  if (!name) return COLOR_PALETTE[0]
  let hash = 0
  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash)
  }
  const paletteIndex = Math.abs(hash) % COLOR_PALETTE.length
  return COLOR_PALETTE[paletteIndex]
}

async function ensureTags(tagNames) {
  let created = 0
  for (const rawName of tagNames) {
    const name = normalizeString(rawName)
    if (!name) continue

    const existing = await Tag.findOne({ name })
    if (existing) continue

    await Tag.create({
      name,
      category: 'general',
      description: `Tag for ${name}`,
      color: pickColor(name),
      usageCount: 0,
      isSystem: false,
    })
    created += 1
  }
  return created
}

async function collectSampleUsers(profileData) {
  const usernames = Array.isArray(profileData)
    ? profileData.map(profile => normalizeString(profile?.username)).filter(Boolean)
    : []

  const userDocs = await User.find(usernames.length ? { username: { $in: usernames } } : {})
    .select('_id username')
    .sort({ username: 1 })

  const userByUsername = new Map()
  const userByLegacyId = new Map()

  userDocs.forEach(doc => {
    userByUsername.set(doc.username, doc._id.toString())
  })

  if (Array.isArray(profileData)) {
    profileData.forEach(profile => {
      if (!profile || profile.id == null) return
      const username = normalizeString(profile.username)
      const userId = userByUsername.get(username)
      if (userId) {
        userByLegacyId.set(profile.id.toString(), userId)
      }
    })
  }

  return {
    userDocs,
    userByUsername,
    userByLegacyId,
  }
}

function collectAllTagNames(tagsData, booksData, postsData) {
  const names = new Set()
  ;(Array.isArray(tagsData) ? tagsData : []).forEach(tag => names.add(tag))
  ;(Array.isArray(booksData) ? booksData : []).forEach(book =>
    (Array.isArray(book?.tags) ? book.tags : []).forEach(tag => names.add(tag)),
  )
  ;(Array.isArray(postsData) ? postsData : []).forEach(post =>
    (Array.isArray(post?.tags) ? post.tags : []).forEach(tag => names.add(tag)),
  )
  return names
}

function resolveOwnerId(item, index, mappings) {
  const legacyId = item?.userId != null ? mappings.userByLegacyId.get(item.userId.toString()) : null
  if (legacyId) {
    return legacyId
  }

  const username = normalizeString(item?.username || item?.owner || '')
  if (username && mappings.userByUsername.has(username)) {
    return mappings.userByUsername.get(username)
  }

  if (mappings.userDocs.length === 0) {
    return null
  }

  const fallbackDoc = mappings.userDocs[index % mappings.userDocs.length]
  return fallbackDoc?._id?.toString() ?? null
}

async function seedBooks(booksData, mappings) {
  if (!Array.isArray(booksData) || booksData.length === 0) {
    return { inserted: 0, map: new Map() }
  }

  const legacyIdMap = new Map()
  let inserted = 0

  for (let index = 0; index < booksData.length; index += 1) {
    const book = booksData[index]
    if (!book || !book.title) continue

    const ownerId = resolveOwnerId(book, index, mappings)
    if (!ownerId) {
      console.warn(`[seed] Skipping book "${book.title}" because no owner could be resolved`)
      continue
    }

    const tags = Array.isArray(book.tags)
      ? book.tags.map(tag => normalizeString(tag)).filter(Boolean)
      : []

    const criteria = {
      userId: ownerId,
      title: normalizeString(book.title),
    }

    let record = await Book.findOne(criteria)
    if (!record) {
      record = await Book.create({
        ...criteria,
        author: normalizeString(book.author) || 'Unknown',
        year: typeof book.year === 'number' ? book.year : undefined,
        cover: normalizeString(book.cover),
        description: normalizeString(book.description),
        tags,
        rating: typeof book.rating === 'number' ? book.rating : undefined,
        status: normalizeString(book.status) || 'want-to-read',
        visibility: normalizeString(book.visibility) || 'public',
        pages: typeof book.pages === 'number' ? book.pages : undefined,
        publisher: normalizeString(book.publisher),
        language: normalizeString(book.language),
        progress: normalizeString(book.status) === 'completed' ? 100 : 0,
        favorite: false,
      })
      inserted += 1
    }

    const legacyKey = book.id != null ? book.id.toString() : record._id.toString()
    legacyIdMap.set(legacyKey, record._id.toString())
  }

  return { inserted, map: legacyIdMap }
}

async function seedPosts(postsData, mappings, bookMap) {
  if (!Array.isArray(postsData) || postsData.length === 0) {
    return 0
  }

  let inserted = 0

  for (const post of postsData) {
    if (!post || !post.content) continue
    const userId =
      (post.userId != null && mappings.userByLegacyId.get(post.userId.toString())) ||
      mappings.userByUsername.get(normalizeString(post.username)) ||
      mappings.userByUsername.get(normalizeString(post.owner))

    if (!userId) {
      console.warn('[seed] Skipping post because no matching user was found')
      continue
    }

    const existing = await Post.findOne({ userId, content: post.content })
    if (existing) {
      continue
    }

    const relatedBooks = Array.isArray(post.books)
      ? post.books
          .map(id => (id != null ? bookMap.get(id.toString()) : null))
          .filter(Boolean)
      : []

    const tags = Array.isArray(post.tags)
      ? post.tags.map(tag => normalizeString(tag)).filter(Boolean)
      : []

    const createdAt = post.timestamp ? new Date(post.timestamp) : new Date()

    await Post.create({
      userId,
      content: post.content,
      books: relatedBooks,
      likes: typeof post.likes === 'number' ? post.likes : 0,
      comments: [],
      tags,
      visibility: 'public',
      isEdited: false,
      createdAt,
    })

    inserted += 1
  }

  return inserted
}

export async function seedFrontendData() {
  if (demoDataReady || isSeedingFrontendData) {
    return
  }

  isSeedingFrontendData = true
  try {
    const [profileDataRaw, booksData, postsData, tagsData] = await Promise.all([
      readJson('profiles.json'),
      readJson('books.json'),
      readJson('posts.json'),
      readJson('tags.json'),
    ])

    const profileData = Array.isArray(profileDataRaw) ? profileDataRaw : []
    const mappings = await collectSampleUsers(profileData)
    if (mappings.userDocs.length === 0) {
      console.warn('[seed] No sample users available, skipping showcase data import')
      return
    }

    if (typeof Book.syncIndexes === 'function') {
      try {
        await Book.syncIndexes()
      } catch (indexError) {
        console.warn('[seed] Could not sync book indexes:', indexError.message)
      }
    } else {
      console.warn('[seed] Book.syncIndexes is unavailable in JSON storage mode - skipping index sync')
    }

    const uniqueTagNames = collectAllTagNames(tagsData, booksData, postsData)
    const createdTags = await ensureTags(uniqueTagNames)

    const { inserted: createdBooks, map: bookMap } = await seedBooks(booksData, mappings)
    const createdPosts = await seedPosts(postsData, mappings, bookMap)

    console.log(
      `[seed] Frontend showcase data ready (${createdTags} new tags, ${createdBooks} books, ${createdPosts} posts)`,
    )
    demoDataReady = true
  } catch (error) {
    console.error('[seed] Failed to import showcase data:', error)
  } finally {
    isSeedingFrontendData = false
  }
}

export default seedFrontendData
