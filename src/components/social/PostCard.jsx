import dayjs from 'dayjs'

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value ?? 0)
}

export default function PostCard({ post, onSelectProfile }) {
  const author = post.author
  const timestamp = dayjs(post.timestamp)

  function handleProfileClick() {
    if (author?.id && typeof onSelectProfile === 'function') {
      onSelectProfile(author.id)
    }
  }

  const tags = Array.isArray(post.tags)
    ? post.tags.map(tag => (tag.startsWith('#') ? tag : `#${tag}`))
    : []

  return (
    <article className="post">
      <header className="post-head">
        <button
          type="button"
          className="post-avatar-button"
          onClick={handleProfileClick}
          aria-label={author?.name ? `View ${author.name}'s profile` : 'View profile'}
        >
          <div
            className="post-avatar"
            style={author?.profileImage ? { backgroundImage: `url(${author.profileImage})` } : undefined}
          />
        </button>
        <div>
          <button type="button" className="post-author-button" onClick={handleProfileClick}>
            <span className="post-name">{author?.name ?? 'Unknown User'}</span>
          </button>
          <div className="post-handle">@{author?.username ?? 'unknown'}</div>
        </div>
      </header>

      <div className="post-body">
        {post.content && <p className="post-text">{post.content}</p>}

        {post.image && (
          <img
            className="post-image"
            src={`${post.image}?auto=compress&fit=crop&w=1200&q=80`}
            alt=""
            loading="lazy"
          />
        )}

        {tags.length > 0 && (
          <div className="post-meta-grid">
            {tags.map(tag => (
              <span key={tag} className="pill">{tag}</span>
            ))}
          </div>
        )}
      </div>

      <footer className="post-foot">
        <span className="time">{timestamp.isValid() ? timestamp.format('MMM D, YYYY at HH:mm') : ''}</span>
        <div className="post-stats">
          <span>{formatNumber(post.likes)} Likes</span>
          <span>{formatNumber(post.comments)} Comments</span>
        </div>
      </footer>
    </article>
  )
}
