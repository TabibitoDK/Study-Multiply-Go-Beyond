import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import bookService from '../../services/bookService.js'
import { useI18nFormats } from '../../lib/i18n-format.js'

function isFunction(value) {
  return typeof value === 'function'
}

export default function PostCard({ post, onSelectProfile }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { formatDateTime, formatNumber } = useI18nFormats()
  const [bookDetails, setBookDetails] = useState({})

  if (!post) {
    return null
  }

  const { author, content, books, likes, comments, timestamp, tags } = post

  const FALLBACK_COVER = 'https://via.placeholder.com/120x180?text=Book'

  const normalizeBookEntry = entry => {
    if (!entry) return null
    if (typeof entry === 'string') {
      return { id: entry, needsFetch: true }
    }
    if (typeof entry === 'object') {
      const id = entry._id || entry.id || entry.bookId || null
      const title = entry.title || entry.name || ''
      const author =
        entry.author ||
        entry.authors?.join?.(', ') ||
        entry.writer ||
        entry.creator ||
        ''
      const cover = entry.cover || entry.image || entry.thumbnail || FALLBACK_COVER

      return {
        id,
        needsFetch: !(id && title),
        data: title
          ? {
              id,
              title,
              author,
              cover,
            }
          : null,
      }
    }
    return null
  }

  // Fetch book details when component mounts or books change
  useEffect(() => {
    let cancelled = false

    const safeBooks = Array.isArray(books) ? books.filter(Boolean) : []
    if (!safeBooks.length) {
      setBookDetails({})
      return undefined
    }

    const initialDetails = {}
    const idsToFetch = []

    safeBooks.forEach(entry => {
      const normalized = normalizeBookEntry(entry)
      if (!normalized || !normalized.id) {
        return
      }
      if (normalized.data) {
        initialDetails[normalized.id] = normalized.data
      }
      if (normalized.needsFetch) {
        idsToFetch.push(normalized.id)
      }
    })

    if (Object.keys(initialDetails).length) {
      setBookDetails(prev => ({ ...prev, ...initialDetails }))
    }

    if (!idsToFetch.length) {
      return undefined
    }

    const fetchMissingBooks = async () => {
      const fetched = {}
      for (const bookId of idsToFetch) {
        try {
          const book = await bookService.getBookById(bookId)
          if (book) {
            fetched[bookId] = {
              id: book.id || book._id || bookId,
              title: book.title || '',
              author:
                book.author ||
                book.authors?.join?.(', ') ||
                book.writer ||
                book.creator ||
                '',
              cover: book.cover || book.image || FALLBACK_COVER,
            }
          }
        } catch (err) {
          console.error(`Error fetching book ${bookId}:`, err)
        }
      }
      if (!cancelled && Object.keys(fetched).length) {
        setBookDetails(prev => ({ ...prev, ...fetched }))
      }
    }

    fetchMissingBooks()

    return () => {
      cancelled = true
    }
  }, [books])

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
            {books.map(entry => {
              const normalized = normalizeBookEntry(entry)
              const bookId = normalized?.id || (typeof entry === 'string' ? entry : null)
              const book =
                (bookId && bookDetails[bookId]) ||
                normalized?.data ||
                null

              if (!book) return null

              return (
                <button
                  key={bookId || book.title}
                  type="button"
                  className="book-reference-box"
                  onClick={() =>
                    bookId
                      ? navigate(`/library/${bookId}`, { state: { from: 'social' } })
                      : undefined
                  }
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
