import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import PostCard from './PostCard.jsx'
import PostModal from './PostModal.jsx'
import ProfileSidebar from './ProfileSidebar.jsx'
import TrendingSidebar from './TrendingSidebar.jsx'
import { getPosts } from '../../lib/posts.js'
import { getProfileById } from '../../lib/profiles.js'
import './SocialPage.css'

export default function SocialPage({ currentUser, posts, onCreatePost, onSelectProfile }) {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const feed = useMemo(() => {
    const source = Array.isArray(posts) && posts.length > 0 ? posts : getPosts()
    return source.map(post => ({
      ...post,
      author: post.author ?? getProfileById(post.userId),
    }))
  }, [posts])

  function handleSubmit(draft) {
    if (typeof onCreatePost === 'function') {
      onCreatePost(draft)
    }
    setIsModalOpen(false)
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
            参考書
          </button>
        </div>
        {feed.map(post => (
          <PostCard key={post.id} post={post} onSelectProfile={onSelectProfile} />
        ))}
      </div>

      <TrendingSidebar />

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
