import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { getBookById } from '../../lib/books.js'

function isFunction(value) {
  return typeof value === 'function'
}

export default function PostCard({ post, onSelectProfile }) {
  const navigate = useNavigate()
  if (!post) {
    return null
  }

  const {
    author,
    content,
    books,
    likes,
    comments,
    timestamp,
    tags,
  } = post

  const authorId = author?.id
  const authorName = author?.name ?? 'Anonymous Student'
  const authorHandle = author?.username ? `@${author.username}` : '@unknown'
  const avatarStyle = author?.profileImage ? { backgroundImage: `url(${author.profileImage})` } : undefined

  const likeCount = typeof likes === 'number' ? likes : 0
  const commentCount = typeof comments === 'number' ? comments : 0
  const safeTags = Array.isArray(tags) ? tags.filter(Boolean) : []

  const isoTime = typeof timestamp === 'string' ? timestamp : null
  const createdAt = isoTime ? dayjs(isoTime) : null
  const formattedTime = createdAt?.isValid() ? createdAt.format('MMM D, YYYY h:mm A') : null

  function handleProfileClick() {
    if (authorId && isFunction(onSelectProfile)) {
      onSelectProfile(authorId)
    }
  }

  return (
    <article className="post">
      <header className="post-head">
        <button
          type="button"
          className="post-avatar-button"
          onClick={handleProfileClick}
          aria-label={`View ${authorName}'s profile`}
        >
          <div className="post-avatar" style={avatarStyle} />
        </button>

        <div>
          <button
            type="button"
            className="post-author-button"
            onClick={handleProfileClick}
            aria-label={`View ${authorName}'s profile`}
          >
            <span className="post-name">{authorName}</span>
          </button>
          <div className="post-handle">{authorHandle}</div>
        </div>
      </header>

      <div className="post-body">
        {content && <p className="post-text">{content}</p>}

        {safeTags.length > 0 && (
          <div className="post-meta-grid">
            {safeTags.map(tag => (
              <span key={tag} className="pill">
                {tag}
              </span>
            ))}
          </div>
        )}

        {Array.isArray(books) && books.length > 0 && (
          <div className="post-book-references">
            {books.map(bookId => {
              const book = getBookById(bookId)
              if (!book) return null

              return (
                <button
                  key={bookId}
                  type="button"
                  className="book-reference-box"
                  onClick={() => navigate(`/library/${bookId}`, { state: { from: 'social' } })}
                  aria-label={`View ${book.title}`}
                >
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="book-reference-cover"
                  />
                  <div className="book-reference-info">
                    <h4 className="book-reference-title">{book.title}</h4>
                    <p className="book-reference-author">{book.author}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <footer className="post-foot">
        <div className="post-stats">
          <span>{likeCount} likes</span>
          <span>{commentCount} comments</span>
        </div>
        {formattedTime && (
          <time className="post-handle" dateTime={isoTime}>
            {formattedTime}
          </time>
        )}
      </footer>
    </article>
  )
}
