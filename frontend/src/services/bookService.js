import api from '../lib/api.js'

// Book service for handling all book-related API calls
export const bookService = {
  // Get all books for the current user
  getAllBooks: async () => {
    try {
      const response = await api.get('/books')
      return response
    } catch (error) {
      console.error('Error fetching books:', error)
      throw error
    }
  },

  // Get a single book by ID
  getBookById: async (id) => {
    try {
      const response = await api.get(`/books/${id}`)
      return response
    } catch (error) {
      console.error('Error fetching book:', error)
      throw error
    }
  },

  // Create a new book
  createBook: async (bookData) => {
    try {
      const response = await api.post('/books', bookData)
      return response
    } catch (error) {
      console.error('Error creating book:', error)
      throw error
    }
  },

  // Update an existing book
  updateBook: async (id, bookData) => {
    try {
      const response = await api.put(`/books/${id}`, bookData)
      return response
    } catch (error) {
      console.error('Error updating book:', error)
      throw error
    }
  },

  // Delete a book
  deleteBook: async (id) => {
    try {
      const response = await api.delete(`/books/${id}`)
      return response
    } catch (error) {
      console.error('Error deleting book:', error)
      throw error
    }
  },

  // Search books by query
  searchBooks: async (query) => {
    try {
      const response = await api.get(`/books/search?q=${encodeURIComponent(query)}`)
      return response
    } catch (error) {
      console.error('Error searching books:', error)
      throw error
    }
  },

  // Filter books by criteria
  filterBooks: async (filters) => {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters.status && filters.status !== 'all') {
        queryParams.append('status', filters.status)
      }
      
      if (filters.visibility && filters.visibility !== 'all') {
        queryParams.append('visibility', filters.visibility)
      }
      
      if (filters.tags && filters.tags.length > 0) {
        queryParams.append('tags', filters.tags.join(','))
      }

      const response = await api.get(`/books/filter?${queryParams.toString()}`)
      return response
    } catch (error) {
      console.error('Error filtering books:', error)
      throw error
    }
  },

  // Get all available tags
  getAllTags: async () => {
    try {
      const response = await api.get('/books/tags')
      return response
    } catch (error) {
      console.error('Error fetching tags:', error)
      throw error
    }
  },

  // Toggle book visibility
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