import { useMemo, useState } from "react"
import dayjs from "dayjs"
import "./Profile.css"
import PostCard from "../components/social/PostCard.jsx"
import PostModal from "../components/social/PostModal.jsx"
import { profiles, getProfileById } from "../lib/profiles.js"
import { getPostsByUser } from "../lib/posts.js"

export default function Profile({
  profileId = 1,
  currentUserId = 1,
  posts: postsProp,
  onCreatePost,
  onSelectProfile,
}) {
  const resolvedProfile =
    getProfileById(profileId) ?? getProfileById(currentUserId) ?? profiles[0]
  const isCurrentUser = resolvedProfile.id === currentUserId

  const [isModalOpen, setIsModalOpen] = useState(false)

  const posts = useMemo(() => {
    const base = Array.isArray(postsProp)
      ? postsProp
      : getPostsByUser(resolvedProfile.id)
    return base
      .filter(post => post.userId === resolvedProfile.id)
      .map(post => ({
        ...post,
        author: post.author ?? resolvedProfile,
      }))
  }, [postsProp, resolvedProfile])

  const joinedDate = dayjs(resolvedProfile.joined)
  const tags = Array.isArray(resolvedProfile.tags) ? resolvedProfile.tags : []

  function handleSubmit(draft) {
    if (typeof onCreatePost === "function") {
      onCreatePost(draft)
    }
    setIsModalOpen(false)
  }

  return (
    <div className="profile-container">
      <div
        className="profile-banner"
        style={
          resolvedProfile.backgroundImage
            ? { backgroundImage: `url(${resolvedProfile.backgroundImage})` }
            : undefined
        }
      />

      <div className="profile-header">
        <div className="profile-avatar">
          {resolvedProfile.profileImage && (
            <img
              src={resolvedProfile.profileImage}
              alt={`${resolvedProfile.name} avatar`}
              loading="lazy"
            />
          )}
        </div>
        <div className="profile-info">
          <h2>{resolvedProfile.name}</h2>
          <p>@{resolvedProfile.username}</p>
          <div className="profile-meta">
            {resolvedProfile.location && <span>{resolvedProfile.location}</span>}
            {resolvedProfile.joined && (
              <span>
                Joined{" "}
                {joinedDate.isValid()
                  ? joinedDate.format("MMMM YYYY")
                  : resolvedProfile.joined}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          className="edit-btn"
          onClick={() => {
            if (!isCurrentUser && typeof onSelectProfile === "function") {
              onSelectProfile(currentUserId)
            }
          }}
          disabled={isCurrentUser}
        >
          {isCurrentUser ? "Your Profile" : "View My Profile"}
        </button>
      </div>

      <hr className="divider" />

      <div className="profile-content">
        <div className="left-side">
          <div className="card">
            <h3>About</h3>
            <p className="profile-about">{resolvedProfile.bio}</p>
          </div>

          <div className="card">
            <h3>Stats</h3>
            <div className="profile-stats">
              <div>
                <span className="profile-stat-value">
                  {resolvedProfile.followers}
                </span>
                <span className="profile-stat-label">Followers</span>
              </div>
              <div>
                <span className="profile-stat-value">
                  {resolvedProfile.following}
                </span>
                <span className="profile-stat-label">Following</span>
              </div>
              <div>
                <span className="profile-stat-value">
                  {resolvedProfile.posts}
                </span>
                <span className="profile-stat-label">Posts</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Interests</h3>
            <div className="profile-tags">
              {tags.map(tag => (
                <span key={tag} className="profile-tag">
                  {tag}
                </span>
              ))}
              {tags.length === 0 && <span className="profile-tag">No tags yet</span>}
            </div>
          </div>
        </div>

        <div className="right-side">
          <div className="profile-posts-header">
            <h3>Recent Posts</h3>
          </div>

          <div className="profile-post-list">
            {isCurrentUser && (
              <article className="post create-post-card">
                <h4>Share an update</h4>
                <p>Let others know what you are working on.</p>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsModalOpen(true)}
                >
                  Create Post
                </button>
              </article>
            )}
            {posts.length === 0 && <div className="profile-empty">No posts yet.</div>}
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onSelectProfile={onSelectProfile}
              />
            ))}
          </div>
        </div>
      </div>

      <PostModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
