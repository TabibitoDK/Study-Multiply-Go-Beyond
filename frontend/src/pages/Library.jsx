import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import BookCard from '../components/library/BookCard.jsx'
import BookModal from '../components/library/BookModal.jsx'
import bookService from '../services/bookService.js'

const collectTags = books =>
  Array.from(
    new Set(
      books.flatMap(book => (Array.isArray(book.tags) ? book.tags : [])),
    ),
  )
    .filter(Boolean)
    .sort()

export default function Library() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const sortBy = 'latest'
  const [selectedTags, setSelectedTags] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingBook, setEditingBook] = useState(null)
  const [allTags, setAllTags] = useState([])

  // Fetch shared books on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const booksData = await bookService.getAllBooks()
        setBooks(booksData)
        setAllTags(collectTags(booksData))
        setError(null)
      } catch (err) {
        console.error('Error fetching library data:', err)
        setError(t('libraryPage.errors.load'))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Refresh books after any CRUD operation
  const refreshBooks = async () => {
    try {
      const booksData = await bookService.getAllBooks()
      setBooks(booksData)
      setAllTags(collectTags(booksData))
    } catch (err) {
      console.error('Error refreshing books:', err)
      setError(t('libraryPage.errors.refresh'))
    }
  }

  // Sort books locally (can be moved to backend if needed)
  const sortBooks = (booksToSort, sortBy) => {
    const sorted = [...booksToSort]
    
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
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      default:
        return sorted
    }
  }

  const filteredAndSearchedBooks = useMemo(() => {
    let result = books

    // Search
    if (searchQuery) {
      result = result.filter(book =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Tag filter
    if (selectedTags.length > 0) {
      result = result.filter(book =>
        selectedTags.some(tag => book.tags.includes(tag))
      )
    }

    // Sort
    result = sortBooks(result, sortBy)

    return result
  }, [books, searchQuery, sortBy, selectedTags])

  const handleAddBook = () => {
    setEditingBook(null)
    setShowModal(true)
  }

  const handleSaveBook = async (formData) => {
    try {
      if (editingBook) {
        await bookService.updateBook(editingBook.id, formData)
      } else {
        await bookService.createBook(formData)
      }
      await refreshBooks()
      setShowModal(false)
      setEditingBook(null)
    } catch (err) {
      console.error('Error saving book:', err)
      setError(t('libraryPage.errors.save'))
    }
  }

  const handleBookClick = (bookId) => {
    navigate(`/library/${bookId}`)
  }

  const handleTagToggle = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedTags([])
  }

  const hasActiveFilters = searchQuery || selectedTags.length > 0

  // Handle loading and error states
  if (loading) {
    return (
      <div className="library-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading library...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="library-page">
        <div className="error-container">
          <p>{error}</p>
          <button onClick={refreshBooks} className="btn">
            {t('buttons.retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="library-page">
      <header className="library-header">
        <div className="library-header-top">
          <h1 className="library-title">{t('libraryPage.title')}</h1>
          <p className="library-subtitle">{t('libraryPage.subtitle')}</p>
        </div>

        <div className="library-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder={t('libraryPage.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <button
            type="button"
            className="btn library-add-btn"
            onClick={handleAddBook}
          >
            <Plus size={18} />
            {t('libraryPage.buttons.add')}
          </button>
        </div>
      </header>

      {hasActiveFilters && (
        <div className="library-filters">
          <button
            type="button"
            className="filter-reset"
            onClick={resetFilters}
          >
            {t('libraryPage.buttons.reset')}
          </button>
        </div>
      )}

      {allTags.length > 0 && (
        <div className="library-tags-section">
          <p className="tags-label">{t('libraryPage.filters.tags')}</p>
          <div className="tags-container">
            {allTags.map(tag => (
              <button
                key={tag}
                type="button"
                className={`tag-filter-btn ${
                  selectedTags.includes(tag) ? 'active' : ''
                }`}
                onClick={() => handleTagToggle(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="library-stats">
        <span className="stat">
          {t('libraryPage.stats.books', { count: filteredAndSearchedBooks.length })}
        </span>
      </div>

      {filteredAndSearchedBooks.length === 0 ? (
        <div className="library-empty">
          <div className="empty-content">
            <h2>{t('libraryPage.empty.title')}</h2>
            <p>
              {hasActiveFilters
                ? t('libraryPage.empty.filters')
                : t('libraryPage.empty.start')}
            </p>
            {!hasActiveFilters && (
              <button
                type="button"
                className="btn"
                onClick={handleAddBook}
              >
                {t('libraryPage.buttons.addFirst')}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="library-grid">
          {filteredAndSearchedBooks.map(book => (
            <BookCard
              key={book.id}
              book={book}
              onBookClick={handleBookClick}
            />
          ))}
        </div>
      )}

      {showModal && (
        <BookModal
          book={editingBook}
          allTags={allTags}
          onSave={handleSaveBook}
          onClose={() => {
            setShowModal(false)
            setEditingBook(null)
          }}
        />
      )}
    </div>
  )
}
