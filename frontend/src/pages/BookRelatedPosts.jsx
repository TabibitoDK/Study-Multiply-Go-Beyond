import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, Calendar } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import bookService from '../services/bookService.js'
import postService from '../services/postService.js'
import PostCard from '../components/social/PostCard.jsx'

export default function BookRelatedPosts() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const [book, setBook] = useState(null)
  const [bookLoading, setBookLoading] = useState(true)
  const [bookError, setBookError] = useState(null)
  const [relatedPosts, setRelatedPosts] = useState([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [postsError, setPostsError] = useState(null)

  const bookId = useMemo(() => (id ? String(id) : null), [id])
  const backPath = location.state?.from ?? `/library/${bookId ?? ''}`

  useEffect(() => {
    async function loadBook() {
      if (!bookId) {
        setBook(null)
        setBookError(t('bookPosts.errors.noSelection'))
        setBookLoading(false)
        return
      }

      try {
        setBookLoading(true)
        const bookData = await bookService.getBookById(bookId)
        setBook(bookData)
        setBookError(null)
      } catch (err) {
        console.error('Error loading book details:', err)
        setBookError(t('bookPosts.errors.loadBook'))
      } finally {
        setBookLoading(false)
      }
    }

    loadBook()
  }, [bookId])

  useEffect(() => {
    async function loadPosts() {
      if (!bookId) {
        setRelatedPosts([])
        return
      }

      try {
        setPostsLoading(true)
        const postsData = await postService.getAllPosts()
        const filtered = postsData.filter(
          post => Array.isArray(post.books) && post.books.some(bookRef => String(bookRef) === bookId),
        )
        setRelatedPosts(filtered)
        setPostsError(null)
      } catch (err) {
        console.error('Error loading related posts:', err)
        setPostsError(t('bookPosts.errors.loadPosts'))
      } finally {
        setPostsLoading(false)
      }
    }

    loadPosts()
  }, [bookId])

  const handleSelectProfile = useCallback(
    profileId => {
      if (!profileId) return
      navigate(`/profile/${profileId}`)
    },
    [navigate],
  )

  if (bookLoading) {
    return (
      <div className="book-related-page">
        <div className="loading-container">
          <div className="spinner" />
          <p>{t('bookPosts.loading.book')}</p>
        </div>
      </div>
    )
  }

  if (bookError || !book) {
    return (
      <div className="book-related-page">
        <div className="error-container">
          <p>{bookError ?? t('bookPosts.errors.loadBook')}</p>
          <button type="button" className="btn" onClick={() => navigate('/library')}>
            {t('bookPosts.buttons.backToLibrary')}
          </button>
        </div>
      </div>
    )
  }

  const safeTags = Array.isArray(book.tags) ? book.tags.filter(Boolean) : []
  const metaStats = [
    book.pages ? { icon: <BookOpen size={16} />, text: t('bookLabels.pages', { count: book.pages }) } : null,
    book.year ? { icon: <Calendar size={16} />, text: t('bookLabels.published', { year: book.year }) } : null,
  ].filter(Boolean)
  const infoPairs = [
    book.publisher ? { label: t('bookLabels.publisher'), value: book.publisher } : null,
    book.language ? { label: t('bookLabels.language'), value: book.language } : null,
    book.status
      ? { label: t('bookLabels.status'), value: t(`bookStatus.${book.status}`, { defaultValue: book.status }) }
      : null,
    book.visibility
      ? { label: t('bookLabels.visibility'), value: t(`bookVisibility.${book.visibility}`, { defaultValue: book.visibility }) }
      : null,
  ].filter(Boolean)

  return (
    <div className="book-related-page">
      <header className="book-related-header">
        <button
          type="button"
          className="back-btn"
          onClick={() => navigate(backPath)}
          aria-label={t('bookPosts.aria.backToDetails')}
        >
          <ArrowLeft size={20} />
          {t('bookPosts.buttons.backToBook')}
        </button>
        <div>
          <p className="book-related-eyebrow">{t('bookPosts.headers.eyebrow')}</p>
          <h1>{t('bookPosts.headers.title', { title: book.title })}</h1>
        </div>
      </header>

      <div className="book-related-grid">
        <aside className="book-related-summary">
          <div className="book-related-summary__media">
            <img src={book.cover} alt={book.title} />
          </div>
          <div className="book-related-summary__body">
            <p className="book-related-eyebrow">{t('bookPosts.headers.featured')}</p>
            <h2>{book.title}</h2>
            <p className="book-related-author">{t('bookLabels.byAuthor', { author: book.author })}</p>
            <div className="book-related-meta">
              {metaStats.map(item => (
                <span key={item.text}>
                  {item.icon}
                  {item.text}
                </span>
              ))}
            </div>
          </div>
        </aside>

        <section className="book-related-feed">
          <div className="book-related-feed__header">
            <h3>{t('bookPosts.headers.related')}</h3>
            {!postsLoading && !postsError && (
              <span className="book-related-posts__count">
                {t('bookPosts.counts.posts', { count: relatedPosts.length })}
              </span>
            )}
          </div>

          {postsLoading ? (
            <div className="book-related-posts__state">
              <div className="spinner" />
              <p>{t('bookPosts.loading.posts')}</p>
            </div>
          ) : postsError ? (
            <div className="book-related-posts__state is-error">
              <p>{postsError}</p>
              <button type="button" className="btn ghost" onClick={() => navigate(`/library/${bookId}`)}>
                {t('bookPosts.buttons.backToBook')}
              </button>
            </div>
          ) : relatedPosts.length === 0 ? (
            <div className="book-related-posts__state">
              <p>{t('bookPosts.empty.posts')}</p>
            </div>
          ) : (
            <ul className="book-related-posts__list" role="list">
              {relatedPosts.map(post => (
                <li
                  key={post.id ?? post._id ?? post.timestamp}
                  className="book-related-posts__item"
                >
                  <PostCard post={post} onSelectProfile={handleSelectProfile} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="book-related-details">
          <h3>{t('bookPosts.headers.details')}</h3>
          {book.description && <p className="book-related-description">{book.description}</p>}
          {infoPairs.length > 0 && (
            <dl className="book-related-info">
              {infoPairs.map(pair => (
                <div key={pair.label}>
                  <dt>{pair.label}</dt>
                  <dd>{pair.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {safeTags.length > 0 && (
            <>
              <h4 className="book-related-tags-title">{t('bookPosts.headers.tags')}</h4>
              <div className="book-related-tags">
                {safeTags.map(tag => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
