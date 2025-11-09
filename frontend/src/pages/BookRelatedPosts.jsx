import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, Calendar } from 'lucide-react'
import bookService from '../services/bookService.js'
import postService from '../services/postService.js'
import PostCard from '../components/social/PostCard.jsx'

const statusLabels = {
  'want-to-read': 'Want to Read',
  reading: 'Currently Reading',
  completed: 'Finished',
}

export default function BookRelatedPosts() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
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
        setBookError('No book selected.')
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
        setBookError('Unable to load book information. Please try again later.')
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
        setPostsError('Unable to load related posts right now.')
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
          <p>Loading book information...</p>
        </div>
      </div>
    )
  }

  if (bookError || !book) {
    return (
      <div className="book-related-page">
        <div className="error-container">
          <p>{bookError ?? 'Book not found.'}</p>
          <button type="button" className="btn" onClick={() => navigate('/library')}>
            Back to Library
          </button>
        </div>
      </div>
    )
  }

  const safeTags = Array.isArray(book.tags) ? book.tags.filter(Boolean) : []
  const metaStats = [
    book.pages ? { icon: <BookOpen size={16} />, text: `${book.pages} pages` } : null,
    book.year ? { icon: <Calendar size={16} />, text: `Published ${book.year}` } : null,
  ].filter(Boolean)
  const infoPairs = [
    book.publisher ? { label: 'Publisher', value: book.publisher } : null,
    book.language ? { label: 'Language', value: book.language } : null,
    book.status ? { label: 'Status', value: statusLabels[book.status] ?? book.status } : null,
    book.visibility ? { label: 'Visibility', value: book.visibility } : null,
  ].filter(Boolean)

  return (
    <div className="book-related-page">
      <header className="book-related-header">
        <button
          type="button"
          className="back-btn"
          onClick={() => navigate(backPath)}
          aria-label="Back to book details"
        >
          <ArrowLeft size={20} />
          Back to Book
        </button>
        <div>
          <p className="book-related-eyebrow">Community posts</p>
          <h1>Posts mentioning {book.title}</h1>
        </div>
      </header>

      <div className="book-related-grid">
        <aside className="book-related-summary">
          <div className="book-related-summary__media">
            <img src={book.cover} alt={book.title} />
          </div>
          <div className="book-related-summary__body">
            <p className="book-related-eyebrow">Featured book</p>
            <h2>{book.title}</h2>
            <p className="book-related-author">by {book.author}</p>
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
            <h3>Related posts</h3>
            {!postsLoading && !postsError && (
              <span className="book-related-posts__count">
                {relatedPosts.length} {relatedPosts.length === 1 ? 'post' : 'posts'}
              </span>
            )}
          </div>

          {postsLoading ? (
            <div className="book-related-posts__state">
              <div className="spinner" />
              <p>Loading related posts...</p>
            </div>
          ) : postsError ? (
            <div className="book-related-posts__state is-error">
              <p>{postsError}</p>
              <button type="button" className="btn ghost" onClick={() => navigate(`/library/${bookId}`)}>
                Back to Book
              </button>
            </div>
          ) : relatedPosts.length === 0 ? (
            <div className="book-related-posts__state">
              <p>No posts mention this book yet. Share one from the social page!</p>
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
          <h3>Book details</h3>
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
              <h4 className="book-related-tags-title">Tags</h4>
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
