import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import PostCard from './PostCard.jsx'
import PostModal from './PostModal.jsx'
import ProfileSidebar from './ProfileSidebar.jsx'
import TrendingSidebar from './TrendingSidebar.jsx'
import postService from '../../services/postService.js'
import profileService from '../../services/profileService.js'
import CatPeekAnimation from '../CatPeekAnimation.jsx'
import './SocialPage.css'

export default function SocialPage({ currentUser, posts, onCreatePost, onSelectProfile }) {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch posts and profiles on component mount
  useEffect(() => {
    const fetchFeedData = async () => {
      try {
        setLoading(true)
        const postsData = Array.isArray(posts) && posts.length > 0
          ? posts
          : await postService.getAllPosts()
        
        // Enrich posts with author profiles
        const enrichedPosts = await Promise.all(
          postsData.map(async (post) => {
            try {
              const author = await profileService.getProfileById(post.userId)
              return {
                ...post,
                author: author
              }
            } catch (err) {
              console.error(`Error fetching author for post ${post.id}:`, err)
              return {
                ...post,
                author: null
              }
            }
          })
        )
        
        setFeed(enrichedPosts)
        setError(null)
      } catch (err) {
        console.error('Error fetching feed data:', err)
        setError('Failed to load social feed. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchFeedData()
  }, [posts])

  // Refresh feed after creating a new post
  const refreshFeed = async () => {
    try {
      const postsData = await postService.getAllPosts()
      
      // Enrich posts with author profiles
      const enrichedPosts = await Promise.all(
        postsData.map(async (post) => {
          try {
            const author = await profileService.getProfileById(post.userId)
            return {
              ...post,
              author: author
            }
          } catch (err) {
            console.error(`Error fetching author for post ${post.id}:`, err)
            return {
              ...post,
              author: null
            }
          }
        })
      )
      
      setFeed(enrichedPosts)
    } catch (err) {
      console.error('Error refreshing feed:', err)
      setError('Failed to refresh feed. Please try again later.')
    }
  }

  async function handleSubmit(draft) {
    try {
      if (typeof onCreatePost === 'function') {
        onCreatePost(draft)
      } else {
        // Create post via API if no handler provided
        await postService.createPost(draft)
        await refreshFeed()
      }
      setIsModalOpen(false)
    } catch (err) {
      console.error('Error creating post:', err)
      setError('Failed to create post. Please try again.')
    }
  }

  // Handle loading and error states
  if (loading) {
    return (
      <div className="social-wrap">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading social feed...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="social-wrap">
        <div className="error-container">
          <p>{error}</p>
          <button onClick={refreshFeed} className="btn">Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="social-wrap">
      <ProfileSidebar
        user={currentUser}
        onNavigateToProfile={() => onSelectProfile && onSelectProfile(currentUser?.id)}
      />

      <div className="feed">
        <div className="feed-header">
          <button
            type="button"
            className="btn library-access-btn"
            onClick={() => navigate('/library')}
          >
            <BookOpen size={18} />
            éQçlèë
          </button>
        </div>
        {feed.length === 0 ? (
          <div className="feed-empty">
            <h2>No posts yet</h2>
            <p>Be the first to share something with the community!</p>
          </div>
        ) : (
          feed.map(post => (
            <PostCard key={post.id} post={post} onSelectProfile={onSelectProfile} />
          ))
        )}
      </div>

      <TrendingSidebar />

      <div className="cat-peek-spot">
        <CatPeekAnimation size={150} />
      </div>

      <button
        type="button"
        className="fab fab-social"
        onClick={() => setIsModalOpen(true)}
        aria-label="Create a new post"
      >
        +
      </button>

      <PostModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
