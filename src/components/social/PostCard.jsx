import dayjs from 'dayjs';

export default function PostCard({ post }) {
  return (
    <article className="post">
      <header className="post-head">
        <div className="post-avatar" />
        <div>
          <div className="post-name">{post.authorName}</div>
          <div className="post-handle">@{post.authorHandle}</div>
        </div>
      </header>

      <div className="post-body">
        {post.text && <p className="post-text">{post.text}</p>}

        <div className="post-meta-grid">
          {post.book && <span className="pill">📖 {post.book}</span>}
          {post.duration && <span className="pill">⏱ {post.duration}</span>}
          {post.subject && <span className="pill">🏷 {post.subject}</span>}
        </div>

        {post.images?.length > 0 && (
          <div className="post-images">
            {post.images.map((_, i) => <div key={i} className="post-img-placeholder" />)}
          </div>
        )}
      </div>

      <footer className="post-foot">
        <span className="time">{dayjs(post.createdAt).format('HH:mm • MMM D YYYY')}</span>
      </footer>
    </article>
  );
}
