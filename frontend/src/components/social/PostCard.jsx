import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getBookById } from '../../lib/books.js'
import { useI18nFormats } from '../../lib/i18n-format.js'

function isFunction(value) {
  return typeof value === 'function'
}

export default function PostCard({ post, onSelectProfile }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { formatDateTime, formatNumber } = useI18nFormats()

  if (!post) {
    return null
  }

  const { author, content, books, likes, comments, timestamp, tags } = post

  const authorId = author?.id
  const authorName = author?.name ?? t('profile.posts.anonymous', { defaultValue: 'Anonymous Student' })
  const authorHandle = author?.username
    ? `@${author.username}`
    : t('profile.posts.unknownHandle', { defaultValue: '@unknown' })
  const avatarStyle = author?.profileImage ? { backgroundImage: `url(${author.profileImage})` } : undefined

  const likeCount = typeof likes === 'number' ? likes : 0
  const commentCount = typeof comments === 'number' ? comments : 0
  const safeTags = Array.isArray(tags) ? tags.filter(Boolean) : []

  const isoTime = typeof timestamp === 'string' ? timestamp : null
  const formattedTime = isoTime
    ? formatDateTime(isoTime, { dateStyle: 'medium', timeStyle: 'short' })
    : null

  function handleProfileClick() {
    if (authorId && isFunction(onSelectProfile)) {
      onSelectProfile(authorId)
    }
  }

  const likesLabel = t('profile.posts.likes', {
    count: likeCount,
    formattedCount: formatNumber(likeCount),
    defaultValue: '{{formattedCount}} likes',
  })
  const commentsLabel = t('profile.posts.comments', {
    count: commentCount,
    formattedCount: formatNumber(commentCount),
    defaultValue: '{{formattedCount}} comments',
  })

  return (
    <article className="post">
      <header className="post-head">
        <button
          type="button"
          className="post-avatar-button"
          onClick={handleProfileClick}
          aria-label={t('profile.posts.viewProfileAria', {
            defaultValue: "View {{name}}'s profile",
            name: authorName,
          })}
        >
          <div className="post-avatar" style={avatarStyle} />
        </button>

        <div>
          <button
            type="button"
            className="post-author-button"
            onClick={handleProfileClick}
            aria-label={t('profile.posts.viewProfileAria', {
              defaultValue: "View {{name}}'s profile",
              name: authorName,
            })}
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
                  aria-label={t('profile.posts.viewBook', {
                    defaultValue: 'View {{title}}',
                    title: book.title,
                  })}
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
          <span>{likesLabel}</span>
          <span>{commentsLabel}</span>
        </div>
        {formattedTime && (
          <time className="post-handle" dateTime={isoTime ?? undefined}>
            {formattedTime}
          </time>
        )}
      </footer>
    </article>
  )
}
