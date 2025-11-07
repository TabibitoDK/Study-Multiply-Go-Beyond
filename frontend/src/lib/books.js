import { loadState, saveState } from './storage.js'
import SAMPLE_BOOKS from '../data/books.json'
import PREDEFINED_TAGS from '../data/tags.json'

const BOOKS_KEY = 'study-app-books-v2-json'

// Clear old localStorage keys to force fresh data from JSON
function migrateStorage() {
  const oldKeys = ['study-app-books-v1', 'study-app-books', BOOKS_KEY]
  oldKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key)
    }
  })
}

// Run migration on module load
migrateStorage()

function notifyBooksUpdated() {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new Event('smgb:books-updated'))
  }
}

function getBooks() {
  try {
    const stored = localStorage.getItem(BOOKS_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
    // Initialize with sample books on first load
    saveBooks(SAMPLE_BOOKS)
    return SAMPLE_BOOKS
  } catch {
    return SAMPLE_BOOKS
  }
}

function saveBooks(books) {
  try {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books))
    notifyBooksUpdated()
  } catch {}
}

export function getAllBooks() {
  return getBooks()
}

export function getBookById(id) {
  const books = getBooks()
  return books.find(book => book.id === id)
}

export function createBook(bookData) {
  const books = getBooks()
  const newBook = {
    id: `book-${Date.now()}`,
    ...bookData,
    createdAt: new Date().toISOString(),
  }
  books.unshift(newBook)
  saveBooks(books)
  return newBook
}

export function updateBook(id, bookData) {
  const books = getBooks()
  const index = books.findIndex(book => book.id === id)
  if (index === -1) return null

  const updated = {
    ...books[index],
    ...bookData,
    updatedAt: new Date().toISOString(),
  }
  books[index] = updated
  saveBooks(books)
  return updated
}

export function deleteBook(id) {
  const books = getBooks()
  const filtered = books.filter(book => book.id !== id)
  saveBooks(filtered)
  return true
}

export function searchBooks(query) {
  const books = getBooks()
  const q = query.toLowerCase()
  return books.filter(book =>
    book.title.toLowerCase().includes(q) ||
    book.author.toLowerCase().includes(q) ||
    book.tags.some(tag => tag.toLowerCase().includes(q))
  )
}

export function filterBooks(filters) {
  let books = getBooks()

  if (filters.status && filters.status !== 'all') {
    books = books.filter(book => book.status === filters.status)
  }

  if (filters.visibility && filters.visibility !== 'all') {
    books = books.filter(book => book.visibility === filters.visibility)
  }

  if (filters.tags && filters.tags.length > 0) {
    books = books.filter(book =>
      filters.tags.some(tag => book.tags.includes(tag))
    )
  }

  return books
}

export function sortBooks(books, sortBy) {
  const sorted = [...books]

  switch (sortBy) {
    case 'latest':
      return sorted.sort((a, b) => {
        const aDate = new Date(a.createdAt || 0)
        const bDate = new Date(b.createdAt || 0)
        return bDate - aDate
      })
    case 'oldest':
      return sorted.sort((a, b) => {
        const aDate = new Date(a.createdAt || 0)
        const bDate = new Date(b.createdAt || 0)
        return aDate - bDate
      })
    case 'popular':
      return sorted.sort((a, b) => b.rating - a.rating)
    default:
      return sorted
  }
}

export function getAllTags() {
  // Start with predefined tags from JSON
  const tagsSet = new Set(PREDEFINED_TAGS)

  // Add any additional tags found in books
  const books = getBooks()
  books.forEach(book => {
    book.tags.forEach(tag => tagsSet.add(tag))
  })

  return Array.from(tagsSet).sort()
}

export function getPredefinedTags() {
  return [...PREDEFINED_TAGS]
}

export function toggleBookVisibility(id) {
  const book = getBookById(id)
  if (!book) return null
  return updateBook(id, {
    visibility: book.visibility === 'public' ? 'private' : 'public'
  })
}
