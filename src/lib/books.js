import { loadState, saveState } from './storage.js'

const BOOKS_KEY = 'study-app-books-v1'

// Sample books for initial state
const SAMPLE_BOOKS = [
  {
    id: '1',
    title: "Don't Make Me Think",
    author: 'Steve Krug',
    year: 2000,
    cover: 'https://covers.openlibrary.org/b/id/8423635-M.jpg',
    description: 'A Common Sense Approach to Web Usability. Since Don\'t Make Me Think was first published in 2000, hundreds of thousands of Web designers and developers have relied on it.',
    tags: ['Design', 'UX', 'Web'],
    rating: 5,
    status: 'completed',
    visibility: 'public',
    pages: 212,
    publisher: 'New Riders Press',
    language: 'English',
  },
  {
    id: '2',
    title: 'The Design of Everyday Things',
    author: 'Don Norman',
    year: 1988,
    cover: 'https://covers.openlibrary.org/b/id/7725272-M.jpg',
    description: 'The Design of Everyday Things is a powerful primer on how--and why--some products satisfy customers while others only frustrate them.',
    tags: ['Design', 'Psychology', 'UX'],
    rating: 4.5,
    status: 'reading',
    visibility: 'public',
    pages: 368,
    publisher: 'Basic Books',
    language: 'English',
  },
  {
    id: '3',
    title: 'Sprint: How to Solve Big Problems and Test New Ideas in Just Five Days',
    author: 'Jake Knapp',
    year: 2016,
    cover: 'https://covers.openlibrary.org/b/id/8119558-M.jpg',
    description: 'From three partners at Google Ventures comes the first book to reveal the five-day process that Google Ventures uses to help its portfolio companies solve difficult problems, test new ideas, and speed up learning.',
    tags: ['Product', 'Innovation', 'Business'],
    rating: 4.5,
    status: 'completed',
    visibility: 'public',
    pages: 352,
    publisher: 'Simon & Schuster',
    language: 'English',
  },
  {
    id: '4',
    title: 'Lean UX',
    author: 'Jeff Gothelf',
    year: 2013,
    cover: 'https://covers.openlibrary.org/b/id/8108843-M.jpg',
    description: 'How to Tackle Big Problems and Test New Ideas in Just Five Days.',
    tags: ['UX', 'Product', 'Agile'],
    rating: 4,
    status: 'want-to-read',
    visibility: 'public',
    pages: 208,
    publisher: "O'Reilly Media",
    language: 'English',
  },
  {
    id: '5',
    title: 'The Road to React',
    author: 'Robin Wieruch',
    year: 2016,
    cover: 'https://covers.openlibrary.org/b/id/8226763-M.jpg',
    description: 'Your journey to master React. Build production-ready applications step by step.',
    tags: ['React', 'JavaScript', 'Development'],
    rating: 4.5,
    status: 'reading',
    visibility: 'private',
    pages: 250,
    publisher: 'Robin Wieruch',
    language: 'English',
  },
]

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
  const books = getBooks()
  const tagsSet = new Set()
  books.forEach(book => {
    book.tags.forEach(tag => tagsSet.add(tag))
  })
  return Array.from(tagsSet).sort()
}

export function toggleBookVisibility(id) {
  const book = getBookById(id)
  if (!book) return null
  return updateBook(id, {
    visibility: book.visibility === 'public' ? 'private' : 'public'
  })
}
