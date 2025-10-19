import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Star,
  Lock,
  Globe,
  Edit2,
  Trash2,
  BookOpen,
  Calendar,
  BookMarked,
  User,
  MoreVertical,
} from 'lucide-react'
import {
  getBookById,
  deleteBook,
  updateBook,
  getAllBooks,
} from '../lib/books.js'
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
  const [book, setBook] = useState(() => getBookById(id))
  const [showModal, setShowModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    if (!book) {
      navigate('/library')
    }
  }, [book, navigate])

  if (!book) {
    return null
  }

  const handleSaveBook = (formData) => {
    updateBook(book.id, formData)
    setBook(getBookById(id))
    setShowModal(false)
  }

  const handleDeleteBook = () => {
    deleteBook(book.id)
    navigate('/library')
  }

  const handleToggleVisibility = () => {
    const newVisibility = book.visibility === 'public' ? 'private' : 'public'
    updateBook(book.id, { visibility: newVisibility })
    setBook(getBookById(id))
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

  const otherBooks = getAllBooks()
    .filter(b => b.author === book.author && b.id !== book.id)
    .slice(0, 3)

  return (
    <div className="book-details">
      <div className="book-details-header">
        <button
          type="button"
          className="back-btn"
          onClick={() => navigate('/library')}
          aria-label="Go back to library"
        >
          <ArrowLeft size={20} />
          Back to Library
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

            <div className="book-quick-actions">
              <button type="button" className="btn">
                <BookOpen size={18} />
                Read Now
              </button>
              <button type="button" className="btn ghost">
                <BookMarked size={18} />
                Borrow
              </button>
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
              <div className="status-badge" style={{ backgroundColor: statusColors[book.status] }}>
                {statusLabels[book.status]}
              </div>
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
