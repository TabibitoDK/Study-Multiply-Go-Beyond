import { useMemo, useState } from "react"
import dayjs from "dayjs"
import { Edit3, Globe, Lock } from "lucide-react"
import "./Profile.css"
import PostCard from "../components/social/PostCard.jsx"
import PostModal from "../components/social/PostModal.jsx"
import ProfileEditModal from "../components/ProfileEditModal.jsx"
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
  const joinedDate = dayjs(resolvedProfile.joined)
  const tags = Array.isArray(resolvedProfile.tags) ? resolvedProfile.tags : []

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editModalType, setEditModalType] = useState(null)
  const [editModalValue, setEditModalValue] = useState(null)

  const [bio, setBio] = useState(resolvedProfile.bio || '')
  const [bioPrivacy, setBioPrivacy] = useState(true)
  const [interests, setInterests] = useState(
    tags.map(tag => ({ text: tag, isPublic: true }))
  )
  const [goals, setGoals] = useState([
    { text: 'Graduate with honors', isPublic: true },
    { text: 'Master React', isPublic: true },
    { text: 'Build 5 projects', isPublic: true }
  ])

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

  function handleSubmit(draft) {
    if (typeof onCreatePost === "function") {
      onCreatePost(draft)
    }
    setIsModalOpen(false)
  }

  function openEditModal(type, value) {
    setEditModalType(type)
    setEditModalValue(value)
    setEditModalOpen(true)
  }

  function handleEditSave(data) {
    if (editModalType === 'bio') {
      setBio(data.text)
      setBioPrivacy(data.isPublic)
    } else if (editModalType === 'interests') {
      setInterests(data)
    } else if (editModalType === 'goals') {
      setGoals(data)
    }
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
        <div className="profile-header-left">
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
        </div>

        <div className="profile-stats-inline">
          <div className="stat-item">
            <span className="profile-stat-value">
              {resolvedProfile.followers}
            </span>
            <span className="profile-stat-label">Followers</span>
          </div>
          <div className="stat-item">
            <span className="profile-stat-value">
              {resolvedProfile.following}
            </span>
            <span className="profile-stat-label">Following</span>
          </div>
          <div className="stat-item">
            <span className="profile-stat-value">
              {resolvedProfile.posts}
            </span>
            <span className="profile-stat-label">Posts</span>
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

      <div className="profile-content-3col">
        <div className="profile-left-column">
          <div className="card">
            <div className="card-header">
              <h3>Bio</h3>
              {isCurrentUser && (
                <button
                  type="button"
                  className="edit-icon-btn"
                  title="Edit Bio"
                  onClick={() => openEditModal('bio', bio)}
                >
                  <Edit3 size={16} />
                </button>
              )}
            </div>
            <div className="bio-section">
              <p className="profile-about">{bio || 'No bio yet.'}</p>
              {isCurrentUser && (
                <span className={`privacy-badge ${bioPrivacy ? 'public' : 'private'}`}>
                  {bioPrivacy ? (
                    <>
                      <Globe size={14} />
                      Public
                    </>
                  ) : (
                    <>
                      <Lock size={14} />
                      Private
                    </>
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Interests</h3>
              {isCurrentUser && (
                <button
                  type="button"
                  className="edit-icon-btn"
                  title="Edit Interests"
                  onClick={() => openEditModal('interests', interests)}
                >
                  <Edit3 size={16} />
                </button>
              )}
            </div>
            <div className="profile-tags">
              {interests.filter(i => isCurrentUser || i.isPublic).map((interest, index) => (
                <span key={index} className="profile-tag">
                  {interest.text}
                  {isCurrentUser && (
                    <span className={`privacy-icon ${interest.isPublic ? 'public' : 'private'}`}>
                      {interest.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                    </span>
                  )}
                </span>
              ))}
              {interests.filter(i => isCurrentUser || i.isPublic).length === 0 && (
                <span className="profile-tag">No interests yet</span>
              )}
            </div>
          </div>
        </div>

        <div className="profile-middle-column">
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

        <div className="profile-right-column">
          <div className="card">
            <div className="card-header">
              <h3>Goals</h3>
              {isCurrentUser && (
                <button
                  type="button"
                  className="edit-icon-btn"
                  title="Edit Goals"
                  onClick={() => openEditModal('goals', goals)}
                >
                  <Edit3 size={16} />
                </button>
              )}
            </div>
            <div className="profile-tags">
              {goals.filter(g => isCurrentUser || g.isPublic).map((goal, index) => (
                <span key={index} className="profile-tag">
                  {goal.text}
                  {isCurrentUser && (
                    <span className={`privacy-icon ${goal.isPublic ? 'public' : 'private'}`}>
                      {goal.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                    </span>
                  )}
                </span>
              ))}
              {goals.filter(g => isCurrentUser || g.isPublic).length === 0 && (
                <span className="profile-tag">No goals yet</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <PostModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />

      <ProfileEditModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleEditSave}
        type={editModalType}
        initialValue={editModalValue}
      />
    </div>
  )
}
