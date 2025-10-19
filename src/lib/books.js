import { loadState, saveState } from './storage.js'

const BOOKS_KEY = 'study-app-books-v1'

// Sample books for initial state - Japanese University Entrance Exam books
const SAMPLE_BOOKS = [
  {
    id: '1',
    title: '化学基礎・化学 セミナー',
    author: '第一学習社',
    year: 2023,
    cover: 'https://via.placeholder.com/200x300/4A90E2/ffffff?text=Chemistry',
    description: '大学共通テストと個別試験に対応した化学の総合問題集。基礎から応用まで幅広い問題を収録。',
    tags: ['化学', '理科', '大学受験'],
    rating: 5,
    status: 'reading',
    visibility: 'public',
    pages: 480,
    publisher: '第一学習社',
    language: '日本語',
  },
  {
    id: '2',
    title: '現代文と古文 キーワード400',
    author: '出口汪',
    year: 2022,
    cover: 'https://via.placeholder.com/200x300/E74C3C/ffffff?text=Literature',
    description: '共通テストと個別試験頻出のキーワードを400語厳選。現代文と古文の必須知識をこれ一冊で。',
    tags: ['国語', '現代文', '古文'],
    rating: 4.5,
    status: 'reading',
    visibility: 'public',
    pages: 240,
    publisher: 'ナガセ',
    language: '日本語',
  },
  {
    id: '3',
    title: '英文法・語法 1000',
    author: 'Z会編集部',
    year: 2023,
    cover: 'https://via.placeholder.com/200x300/52C41A/ffffff?text=English',
    description: '大学受験英語の文法・語法を完全網羅。1000問の演習で実力を確認できます。',
    tags: ['英語', '英文法', '大学受験'],
    rating: 4,
    status: 'reading',
    visibility: 'public',
    pages: 320,
    publisher: 'Z会',
    language: '日本語',
  },
  {
    id: '4',
    title: '理系数学 ハンドブック',
    author: '駿台文庫',
    year: 2023,
    cover: 'https://via.placeholder.com/200x300/9B59B6/ffffff?text=Math',
    description: '数学ⅠA、ⅡB、Ⅲの全単元をコンパクトにまとめた参考書。試験直前の確認に最適。',
    tags: ['数学', '理系', '受験'],
    rating: 5,
    status: 'completed',
    visibility: 'public',
    pages: 400,
    publisher: '駿台文庫',
    language: '日本語',
  },
  {
    id: '5',
    title: '日本史 通史問題集',
    author: '山川出版社',
    year: 2023,
    cover: 'https://via.placeholder.com/200x300/F39C12/ffffff?text=History',
    description: '共通テストから難関大学まで対応。時代別・テーマ別の問題で日本史を制覇。',
    tags: ['日本史', '社会', '通史'],
    rating: 4.5,
    status: 'want-to-read',
    visibility: 'public',
    pages: 380,
    publisher: '山川出版社',
    language: '日本語',
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
