import api from '../lib/api.js'

const FALLBACK_COVER = 'https://via.placeholder.com/120x180?text=Book'

const normalizeBook = book => {
  if (!book) return null

  const tags = Array.isArray(book.tags) ? book.tags.filter(Boolean) : []
  const coverImage = book.cover || book.image || FALLBACK_COVER

  return {
    ...book,
    id: book.id || book._id,
    cover: coverImage,
    image: coverImage,
    tags,
    rating: typeof book.rating === 'number' ? book.rating : Number(book.rating) || 0,
    visibility: book.visibility || 'public',
    createdAt: book.createdAt || book.updatedAt || new Date().toISOString(),
    updatedAt: book.updatedAt || book.createdAt || null,
    userId: typeof book.userId === 'object' ? (book.userId?._id || book.userId?.id) : book.userId,
  }
}

const normalizeBookList = books => {
  if (!Array.isArray(books)) return []
  return books.map(normalizeBook).filter(Boolean)
}

const PUBLIC_LIMIT = 100

const fetchPublicBooks = async (queryString = '') => {
  const response = await api.get(`/books/public?limit=${PUBLIC_LIMIT}${queryString}`)
  return normalizeBookList(response?.books ?? response)
}

// Book service for handling all book-related API calls
export const bookService = {
  // Get all public books (shared library)
  getAllBooks: async () => {
    try {
      return await fetchPublicBooks()
    } catch (error) {
      console.error('Error fetching books:', error)
      throw error
    }
  },

  // Get a single book by ID
  getBookById: async (id) => {
    try {
      const response = await api.get(`/books/${id}`)
      return normalizeBook(response?.book ?? response)
    } catch (error) {
      console.error('Error fetching book:', error)
      throw error
    }
  },

  // Create a new book (always public)
  createBook: async (bookData) => {
    try {
      const payload = {
        ...bookData,
        visibility: 'public',
      }
      const response = await api.post('/books', payload)
      return normalizeBook(response?.book ?? response)
    } catch (error) {
      console.error('Error creating book:', error)
      throw error
    }
  },

  // Update an existing book
  updateBook: async (id, bookData) => {
    try {
      const response = await api.put(`/books/${id}`, {
        ...bookData,
        visibility: bookData.visibility || 'public',
      })
      return normalizeBook(response?.book ?? response)
    } catch (error) {
      console.error('Error updating book:', error)
      throw error
    }
  },

  // Delete a book
  deleteBook: async (id) => {
    try {
      return await api.delete(`/books/${id}`)
    } catch (error) {
      console.error('Error deleting book:', error)
      throw error
    }
  },

  // Search books by query (public scope)
  searchBooks: async (query) => {
    try {
      return await fetchPublicBooks(`&search=${encodeURIComponent(query)}`)
    } catch (error) {
      console.error('Error searching books:', error)
      throw error
    }
  },

  // Filter books by criteria (public scope)
  filterBooks: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams()

      if (filters.status && filters.status !== 'all') {
        queryParams.append('status', filters.status)
      }

      if (filters.tags && filters.tags.length > 0) {
        filters.tags.forEach(tag => queryParams.append('tags', tag))
      }

      const query = queryParams.toString()
      return await fetchPublicBooks(query ? `&${query}` : '')
    } catch (error) {
      console.error('Error filtering books:', error)
      throw error
    }
  },

  // Get all available tags across public books
  getAllTags: async () => {
    try {
      const books = await fetchPublicBooks()
      const tagSet = new Set()
      books.forEach(book => {
        (book.tags || []).forEach(tag => tagSet.add(tag))
      })
      return Array.from(tagSet).sort()
    } catch (error) {
      console.error('Error collecting tags:', error)
      throw error
    }
  },

  // Toggle book visibility (still available for owner actions)
  toggleBookVisibility: async (id) => {
    try {
      const response = await api.put(`/books/${id}/toggle-visibility`)
      return response
    } catch (error) {
      console.error('Error toggling book visibility:', error)
      throw error
    }
  }
}

export default bookService
