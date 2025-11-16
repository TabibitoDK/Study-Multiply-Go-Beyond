import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import PostCard from './PostCard.jsx'
import PostModal from './PostModal.jsx'
import ProfileSidebar from './ProfileSidebar.jsx'
import FriendSuggestions from './FriendSuggestions.jsx'
import postService from '../../services/postService.js'
import profileService from '../../services/profileService.js'
import CatPeekAnimation from '../CatPeekAnimation.jsx'
import './SocialPage.css'

export default function SocialPage({
  currentUser,
  posts,
  onCreatePost,
  onSelectProfile,
  onFriendFollow = () => {},
  onFriendUnfollow = () => {},
  onGroupJoin = () => {},
}) {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchFeedFromServer = useCallback(async (withSpinner = true) => {
    if (withSpinner) {
      setLoading(true)
    }

    try {
      const postsData = await postService.getAllPosts()

      let profilesData = []
      try {
        profilesData = await profileService.getAllProfiles()
      } catch (profileErr) {
        console.warn('Profile directory unavailable, continuing with posts only.', profileErr)
      }

      const profilesByUserId = new Map((profilesData || []).map(profile => [profile.userId, profile]))

      const enrichedPosts = await Promise.all(
        postsData.map(async post => {
          if (post.author) {
            return post
          }

          try {
            const authorProfile =
              profilesByUserId.get(post.userId) || (await profileService.getProfileById(post.userId))

            return {
              ...post,
              author: authorProfile ?? null,
            }
          } catch (err) {
            console.error(`Error fetching author for post ${post.id}:`, err)
            return {
              ...post,
              author: null,
            }
          }
        }),
      )

      setFeed(enrichedPosts)
      setError(null)
    } catch (err) {
      console.error('Error fetching feed data:', err)
      setError('Failed to load social feed. Please try again later.')
    } finally {
      if (withSpinner) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (Array.isArray(posts) && posts.length > 0) {
      setFeed(posts)
      setError(null)
      setLoading(false)
      return
    }

    fetchFeedFromServer(true)
  }, [posts, fetchFeedFromServer])

  const refreshFeed = useCallback(async () => {
    await fetchFeedFromServer(false)
  }, [fetchFeedFromServer])

  async function handleSubmit(draft) {
    try {
      if (typeof onCreatePost === 'function') {
        onCreatePost(draft)
      } else {
        const segments = []
        if (draft.text?.trim()) segments.push(draft.text.trim())
        if (draft.duration?.trim()) segments.push(`Duration: ${draft.duration.trim()}`)

        const tags = draft.subject?.trim() ? [draft.subject.trim()] : []
        const payload = {
          content: segments.join('\n\n') || 'Shared a new update.',
          tags,
          books: draft.bookId ? [draft.bookId] : [],
          visibility: 'public',
        }

        const optimisticBooks =
          draft.bookId && (draft.bookTitle || draft.bookAuthor || draft.bookCover)
            ? [
                {
                  id: draft.bookId,
                  title: draft.bookTitle || '',
                  author: draft.bookAuthor || '',
                  cover: draft.bookCover || '',
                },
              ]
            : []

        const createdPost = await postService.createPost(payload)
        const authorProfile = currentUser
          ? {
              id: currentUser.id,
              name: currentUser.name || currentUser.username || currentUser.email,
              username: currentUser.username || currentUser.name || '',
              profileImage: currentUser.profileImage || '',
            }
          : null

        setFeed(prev => [
          {
            ...createdPost,
            books: optimisticBooks.length ? optimisticBooks : createdPost.books ?? [],
            author: authorProfile ?? createdPost.author ?? null,
          },
          ...prev,
        ])
      }

      setIsModalOpen(false)
    } catch (err) {
      console.error('Error creating post:', err)
      setError('Failed to create post. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="social-wrap">
        <div className="loading-container">
          <div className="spinner" />
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
          <button type="button" className="btn library-access-btn" onClick={() => navigate('/library')}>
            <BookOpen size={18} />
            Library
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

      <FriendSuggestions
        onFriendFollow={onFriendFollow}
        onFriendUnfollow={onFriendUnfollow}
        onGroupJoin={onGroupJoin}
      />

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

      <PostModal open={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} />
    </div>
  )
}
