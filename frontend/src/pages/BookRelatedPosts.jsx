import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, Calendar } from 'lucide-react'
import bookService from '../services/bookService.js'
import postService from '../services/postService.js'
import PostCard from '../components/social/PostCard.jsx'

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

      <section className="book-related-summary">
        <div className="book-related-summary__media">
          <img src={book.cover} alt={book.title} />
        </div>
        <div className="book-related-summary__body">
          <h2>{book.title}</h2>
          <p className="book-related-author">by {book.author}</p>
          <div className="book-related-meta">
            {book.pages && (
              <span>
                <BookOpen size={16} />
                {book.pages} pages
              </span>
            )}
            {book.year && (
              <span>
                <Calendar size={16} />
                Published {book.year}
              </span>
            )}
          </div>
          {book.description && <p className="book-related-description">{book.description}</p>}
        </div>
      </section>

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
          <div className="book-related-posts__list">
            {relatedPosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
