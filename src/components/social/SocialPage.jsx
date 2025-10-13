import { useMemo, useState } from 'react'
import PostCard from './PostCard.jsx'
import PostModal from './PostModal.jsx'
import { getPosts } from '../../lib/posts.js'
import { getProfileById } from '../../lib/profiles.js'

export default function SocialPage({ posts, onCreatePost, onSelectProfile }) {
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
      <div className="feed">
        {feed.map(post => (
          <PostCard key={post.id} post={post} onSelectProfile={onSelectProfile} />
        ))}
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
