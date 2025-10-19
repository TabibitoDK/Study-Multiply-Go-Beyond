import { Star, Lock, Globe } from 'lucide-react'

export default function BookCard({ book, onBookClick, onEdit, onDelete }) {
  const handleClick = () => {
    onBookClick?.(book.id)
  }

  const statusLabels = {
    'want-to-read': 'Want to Read',
    'reading': 'Reading',
    'completed': 'Read',
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={14}
        className={i < Math.floor(rating) ? 'star-filled' : 'star-empty'}
      />
    ))
  }

  return (
    <div className="book-card">
      <button
        type="button"
        className="book-card-image-btn"
        onClick={handleClick}
        aria-label={`View ${book.title}`}
      >
        <div className="book-card-image">
          <img src={book.cover} alt={book.title} />
        </div>
      </button>

      <div className="book-card-content">
        <button
          type="button"
          className="book-card-title-btn"
          onClick={handleClick}
          aria-label={`View ${book.title}`}
        >
          <h3 className="book-card-title">{book.title}</h3>
        </button>

        <p className="book-card-author">{book.author}</p>

        <div className="book-card-rating">
          <div className="book-card-stars">
            {renderStars(book.rating)}
          </div>
          <span className="book-card-rating-value">{book.rating}</span>
        </div>

        <div className="book-card-meta">
          <span className={`book-card-status status-${book.status}`}>
            {statusLabels[book.status] || book.status}
          </span>
          {book.visibility === 'private' ? (
            <Lock size={14} className="book-card-privacy" />
          ) : (
            <Globe size={14} className="book-card-privacy" />
          )}
        </div>

        {book.tags && book.tags.length > 0 && (
          <div className="book-card-tags">
            {book.tags.slice(0, 2).map(tag => (
              <span key={tag} className="book-card-tag">
                {tag}
              </span>
            ))}
            {book.tags.length > 2 && (
              <span className="book-card-tag-more">
                +{book.tags.length - 2}
              </span>
            )}
          </div>
        )}

        <div className="book-card-actions">
          <button
            type="button"
            className="book-card-action-btn"
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.(book.id)
            }}
            title="Edit book"
          >
            Edit
          </button>
          <button
            type="button"
            className="book-card-action-btn delete"
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.(book.id)
            }}
            title="Delete book"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
