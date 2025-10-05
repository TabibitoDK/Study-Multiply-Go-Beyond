import PostCard from './PostCard'
import { getPosts } from '../../lib/posts.js'
import { getProfileById } from '../../lib/profiles.js'

export default function SocialPage({ onSelectProfile }) {
  const feed = getPosts().map(post => ({
    ...post,
    author: getProfileById(post.userId),
  }))

  return (
    <div className="social-wrap">
      <div className="feed">
        {feed.map(post => (
          <PostCard key={post.id} post={post} onSelectProfile={onSelectProfile} />
        ))}
      </div>
    </div>
  )
}
