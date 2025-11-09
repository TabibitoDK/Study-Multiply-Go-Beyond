import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  Star,
  Lock,
  Globe,
  Edit2,
  Trash2,
  BookOpen,
  Calendar,
  MoreVertical,
} from 'lucide-react'
import bookService from '../services/bookService.js'
import BookModal from '../components/library/BookModal.jsx'

const statusLabels = {
  'want-to-read': 'Want to Read',
  'reading': 'Currently Reading',
  'completed': 'Finished',
}

const statusColors = {
  'want-to-read': '#f59e0b',
  'reading': '#3b82f6',
  'completed': '#10b981',
}

export default function BookDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [otherBooks, setOtherBooks] = useState([])

  // Determine back navigation based on where user came from
  const fromSocial = location.state?.from === 'social'
  const backPath = fromSocial ? '/social' : '/library'
  const backText = fromSocial ? 'Back to Social' : 'Back to Library'

  // Fetch book data
  useEffect(() => {
    const fetchBookData = async () => {
      try {
        setLoading(true)
        const bookData = await bookService.getBookById(id)
        setBook(bookData)
        
        // Fetch other books by the same author
        const allBooks = await bookService.getAllBooks()
        const relatedBooks = allBooks
          .filter(b => b.author === bookData.author && b.id !== id)
          .slice(0, 3)
        setOtherBooks(relatedBooks)
        
        setError(null)
      } catch (err) {
        console.error('Error fetching book details:', err)
        setError('Failed to load book details. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchBookData()
    }
  }, [id])

  useEffect(() => {
    if (!loading && !book) {
      navigate(backPath)
    }
  }, [book, loading, navigate, backPath])

  // Handle loading and error states
  if (loading) {
    return (
      <div className="book-details">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading book details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="book-details">
        <div className="error-container">
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn">Retry</button>
        </div>
      </div>
    )
  }

  if (!book) {
    return null
  }

  const handleSaveBook = async (formData) => {
    try {
      const updatedBook = await bookService.updateBook(book.id, formData)
      setBook(updatedBook)
      setShowModal(false)
    } catch (err) {
      console.error('Error saving book:', err)
      setError('Failed to save book. Please try again.')
    }
  }

  const handleDeleteBook = async () => {
    try {
      await bookService.deleteBook(book.id)
      navigate(backPath)
    } catch (err) {
      console.error('Error deleting book:', err)
      setError('Failed to delete book. Please try again.')
    }
  }

  const handleToggleVisibility = async () => {
    try {
      const newVisibility = book.visibility === 'public' ? 'private' : 'public'
      const updatedBook = await bookService.updateBook(book.id, { visibility: newVisibility })
      setBook(updatedBook)
    } catch (err) {
      console.error('Error toggling visibility:', err)
      setError('Failed to update visibility. Please try again.')
    }
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={18}
        fill={i < Math.floor(rating) ? 'currentColor' : 'none'}
        className={i < Math.floor(rating) ? 'star-filled' : 'star-empty'}
      />
    ))
  }


  return (
    <div className="book-details">
      <div className="book-details-header">
        <button
          type="button"
          className="back-btn"
          onClick={() => navigate(backPath)}
          aria-label={`Go back to ${fromSocial ? 'social' : 'library'}`}
        >
          <ArrowLeft size={20} />
          {backText}
        </button>

        <div className="book-details-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={handleToggleVisibility}
            title={book.visibility === 'public' ? 'Make private' : 'Make public'}
          >
            {book.visibility === 'private' ? (
              <Lock size={20} />
            ) : (
              <Globe size={20} />
            )}
          </button>

          <div className="menu-container">
            <button
              type="button"
              className="icon-btn"
              onClick={() => setShowMenu(!showMenu)}
              aria-label="More options"
            >
              <MoreVertical size={20} />
            </button>

            {showMenu && (
              <div className="dropdown-menu">
                <button
                  type="button"
                  className="menu-item"
                  onClick={() => {
                    setShowModal(true)
                    setShowMenu(false)
                  }}
                >
                  <Edit2 size={16} />
                  Edit Book
                </button>
                <button
                  type="button"
                  className="menu-item delete"
                  onClick={() => {
                    setShowDeleteConfirm(true)
                    setShowMenu(false)
                  }}
                >
                  <Trash2 size={16} />
                  Delete Book
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="book-details-content">
        <div className="book-details-main">
          <div className="book-cover-section">
            <div className="book-cover-container">
              <img src={book.cover} alt={book.title} className="book-cover-img" />
            </div>
          </div>

          <div className="book-info-section">
            <div className="book-header-info">
              <h1 className="book-details-title">{book.title}</h1>
              <p className="book-details-author">by {book.author}</p>
            </div>

            <div className="book-rating-section">
              <div className="book-stars">
                {renderStars(book.rating)}
              </div>
              <span className="book-rating-text">
                {book.rating} ratings
              </span>
            </div>

            <div className="book-status-section">
              <button
                type="button"
                className="btn post-related-btn"
                onClick={() =>
                  navigate(`/library/${book.id}/related-posts`, {
                    state: { from: location.pathname },
                  })
                }
              >
                Related Posts
              </button>
              <div className="visibility-badge">
                {book.visibility === 'private' ? (
                  <>
                    <Lock size={14} />
                    Private
                  </>
                ) : (
                  <>
                    <Globe size={14} />
                    Public
                  </>
                )}
              </div>
            </div>

            <div className="book-metadata">
              {book.pages && (
                <div className="metadata-item">
                  <BookOpen size={16} />
                  <span><strong>{book.pages}</strong> pages</span>
                </div>
              )}
              {book.year && (
                <div className="metadata-item">
                  <Calendar size={16} />
                  <span>Published <strong>{book.year}</strong></span>
                </div>
              )}
              {book.language && (
                <div className="metadata-item">
                  <span><strong>{book.language}</strong></span>
                </div>
              )}
            </div>

            {book.publisher && (
              <div className="book-publisher">
                <strong>Publisher:</strong> {book.publisher}
              </div>
            )}

            {book.description && (
              <div className="book-description">
                <h3>Description</h3>
                <p>{book.description}</p>
              </div>
            )}

            {book.tags && book.tags.length > 0 && (
              <div className="book-tags-section">
                <h3>Tags</h3>
                <div className="book-tags">
                  {book.tags.map(tag => (
                    <span key={tag} className="book-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {otherBooks.length > 0 && (
          <div className="book-related-section">
            <h3>Other Books by {book.author.split(' ')[0]}</h3>
            <div className="related-books-grid">
              {otherBooks.map(relatedBook => (
                <button
                  key={relatedBook.id}
                  type="button"
                  className="related-book-card"
                  onClick={() => navigate(`/library/${relatedBook.id}`)}
                >
                  <img src={relatedBook.cover} alt={relatedBook.title} />
                  <div className="related-book-info">
                    <p className="related-book-title">{relatedBook.title}</p>
                    <p className="related-book-year">{relatedBook.year}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div
            className="modal delete-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-title">Delete Book?</h2>
            <p>
              Are you sure you want to delete "{book.title}"? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn ghost"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={handleDeleteBook}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <BookModal
          book={book}
          allTags={book.tags}
          onSave={handleSaveBook}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
