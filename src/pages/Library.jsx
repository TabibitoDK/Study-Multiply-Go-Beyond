import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Trash2,
  Edit2,
} from 'lucide-react'
import BookCard from '../components/library/BookCard.jsx'
import BookModal from '../components/library/BookModal.jsx'
import {
  getAllBooks,
  updateBook,
  createBook,
  sortBooks,
  getAllTags,
} from '../lib/books.js'

export default function Library() {
  const navigate = useNavigate()
  const [books, setBooks] = useState(() => getAllBooks())
  const [searchQuery, setSearchQuery] = useState('')
  const sortBy = 'latest'
  const [selectedTags, setSelectedTags] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingBook, setEditingBook] = useState(null)

  const allTags = useMemo(() => getAllTags(), [])

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

  const handleSaveBook = (formData) => {
    if (editingBook) {
      updateBook(editingBook.id, formData)
    } else {
      createBook(formData)
    }
    setBooks(getAllBooks())
    setShowModal(false)
    setEditingBook(null)
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

  return (
    <div className="library-page">
      <header className="library-header">
        <div className="library-header-top">
          <h1 className="library-title">Library</h1>
          <p className="library-subtitle">マイ・ライブラリー</p>
        </div>

        <div className="library-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by title, author, or tags..."
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
            Add Book
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
            Reset
          </button>
        </div>
      )}

      {allTags.length > 0 && (
        <div className="library-tags-section">
          <p className="tags-label">Filter by tags:</p>
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
          {filteredAndSearchedBooks.length} book{filteredAndSearchedBooks.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filteredAndSearchedBooks.length === 0 ? (
        <div className="library-empty">
          <div className="empty-content">
            <h2>No books found</h2>
            <p>
              {hasActiveFilters
                ? 'Try adjusting your search or filters.'
                : "Start building your library by adding your first book!"}
            </p>
            {!hasActiveFilters && (
              <button
                type="button"
                className="btn"
                onClick={handleAddBook}
              >
                Add Your First Book
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
