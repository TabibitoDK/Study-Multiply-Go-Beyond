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
import { useTranslation } from 'react-i18next'

const statusColors = {
  'want-to-read': '#f59e0b',
  'reading': '#3b82f6',
  'completed': '#10b981',
}

export default function BookDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
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
  const backText = fromSocial ? t('bookDetails.backToSocial') : t('bookDetails.backToLibrary')

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
        setError(t('bookDetails.errors.load'))
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
          <p>{t('bookDetails.loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="book-details">
        <div className="error-container">
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn">
            {t('buttons.retry')}
          </button>
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
      setError(t('bookDetails.errors.save'))
    }
  }

  const handleDeleteBook = async () => {
    try {
      await bookService.deleteBook(book.id)
      navigate(backPath)
    } catch (err) {
      console.error('Error deleting book:', err)
      setError(t('bookDetails.errors.delete'))
    }
  }

  const handleToggleVisibility = async () => {
    try {
      const newVisibility = book.visibility === 'public' ? 'private' : 'public'
      const updatedBook = await bookService.updateBook(book.id, { visibility: newVisibility })
      setBook(updatedBook)
    } catch (err) {
      console.error('Error toggling visibility:', err)
      setError(t('bookDetails.errors.visibility'))
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
          aria-label={t('bookDetails.aria.back', {
            destination: fromSocial ? t('nav.social') : t('nav.library'),
          })}
        >
          <ArrowLeft size={20} />
          {backText}
        </button>

        <div className="book-details-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={handleToggleVisibility}
            title={
              book.visibility === 'public'
                ? t('bookDetails.visibility.makePrivate')
                : t('bookDetails.visibility.makePublic')
            }
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
              aria-label={t('bookDetails.aria.moreOptions')}
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
                  {t('bookDetails.buttons.edit')}
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
                  {t('bookDetails.buttons.delete')}
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
              <p className="book-details-author">{t('bookLabels.byAuthor', { author: book.author })}</p>
            </div>

            <div className="book-rating-section">
              <div className="book-stars">
                {renderStars(book.rating)}
              </div>
              <span className="book-rating-text">
                {t('bookDetails.rating.label', { value: book.rating })}
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
                {t('bookDetails.buttons.relatedPosts')}
              </button>
              <div className="visibility-badge">
                {book.visibility === 'private' ? (
                  <>
                    <Lock size={14} />
                    {t('bookVisibility.private')}
                  </>
                ) : (
                  <>
                    <Globe size={14} />
                    {t('bookVisibility.public')}
                  </>
                )}
              </div>
            </div>

            <div className="book-metadata">
              {book.pages && (
                <div className="metadata-item">
                  <BookOpen size={16} />
                  <span>{t('bookLabels.pages', { count: book.pages })}</span>
                </div>
              )}
              {book.year && (
                <div className="metadata-item">
                  <Calendar size={16} />
                  <span>{t('bookLabels.published', { year: book.year })}</span>
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
                <strong>{t('bookLabels.publisher')}:</strong> {book.publisher}
              </div>
            )}

            {book.description && (
              <div className="book-description">
                <h3>{t('bookDetails.sections.description')}</h3>
                <p>{book.description}</p>
              </div>
            )}

            {book.tags && book.tags.length > 0 && (
              <div className="book-tags-section">
                <h3>{t('bookDetails.sections.tags')}</h3>
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
            <h3>
              {t('bookDetails.sections.otherBooks', {
                name: book.author.split(' ')[0] || book.author,
              })}
            </h3>
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
            <h2 className="modal-title">{t('bookDetails.modal.delete.title')}</h2>
            <p>{t('bookDetails.modal.delete.body', { title: book.title })}</p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn ghost"
                onClick={() => setShowDeleteConfirm(false)}
              >
                {t('buttons.cancel')}
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={handleDeleteBook}
              >
                {t('buttons.delete')}
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
