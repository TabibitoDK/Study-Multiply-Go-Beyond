import dayjs from 'dayjs'

function isFunction(value) {
  return typeof value === 'function'
}

export default function PostCard({ post, onSelectProfile }) {
  if (!post) {
    return null
  }

  const {
    author,
    content,
    image,
    likes,
    comments,
    timestamp,
    tags,
  } = post

  const authorId = author?.id
  const authorName = author?.name ?? 'Anonymous Student'
  const authorHandle = author?.username ? `@${author.username}` : '@unknown'
  const avatarStyle = author?.profileImage ? { backgroundImage: `url(${author.profileImage})` } : undefined

  const likeCount = typeof likes === 'number' ? likes : 0
  const commentCount = typeof comments === 'number' ? comments : 0
  const safeTags = Array.isArray(tags) ? tags.filter(Boolean) : []

  const isoTime = typeof timestamp === 'string' ? timestamp : null
  const createdAt = isoTime ? dayjs(isoTime) : null
  const formattedTime = createdAt?.isValid() ? createdAt.format('MMM D, YYYY h:mm A') : null

  function handleProfileClick() {
    if (authorId && isFunction(onSelectProfile)) {
      onSelectProfile(authorId)
    }
  }

  return (
    <article className="post">
      <header className="post-head">
        <button
          type="button"
          className="post-avatar-button"
          onClick={handleProfileClick}
          aria-label={`View ${authorName}'s profile`}
        >
          <div className="post-avatar" style={avatarStyle} />
        </button>

        <div>
          <button
            type="button"
            className="post-author-button"
            onClick={handleProfileClick}
            aria-label={`View ${authorName}'s profile`}
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

        {typeof image === 'string' && image.trim() !== '' && (
          <img
            className="post-image"
            src={image}
            alt={`Post from ${authorName}`}
            loading="lazy"
          />
        )}
      </div>

      <footer className="post-foot">
        <div className="post-stats">
          <span>{likeCount} likes</span>
          <span>{commentCount} comments</span>
        </div>
        {formattedTime && (
          <time className="post-handle" dateTime={isoTime}>
            {formattedTime}
          </time>
        )}
      </footer>
    </article>
  )
}
