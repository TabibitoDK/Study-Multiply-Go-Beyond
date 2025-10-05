import React, { useEffect, useState } from "react"
import "./Profile.css"
import PostModal from "../components/social/PostModal.jsx"
import PostCard from "../components/social/PostCard.jsx"

const STORAGE_KEY = "smgb-profile-posts-v1"

function createId(prefix = "profile-post") {
  const cryptoApi = typeof globalThis !== "undefined" ? globalThis.crypto : undefined
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
    return `${prefix}-${cryptoApi.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function seedPosts() {
  return [
    {
      id: createId(),
      authorName: "Nickname",
      authorHandle: "username",
      text: "Today I studied calculus for 2 hours!",
      book: null,
      duration: "2h",
      subject: "Calculus",
      images: [],
      createdAt: new Date().toISOString(),
    },
  ]
}

export default function Profile() {
  const [posts, setPosts] = useState(() => {
    if (typeof window === "undefined") return seedPosts()
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      const parsed = stored ? JSON.parse(stored) : null
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    } catch {}
    return seedPosts()
  })
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
    } catch {}
  }, [posts])

  function handleAddPost(post) {
    setPosts(prev => [post, ...prev])
  }

  return (
    <div className="profile-container">
      <div className="profile-banner" />

      <div className="profile-header">
        <div className="profile-avatar" />
        <div className="profile-info">
          <h2>Nickname</h2>
          <p>@username</p>
        </div>
        <button className="edit-btn">edit</button>
      </div>

      <hr className="divider" />

      <div className="profile-content">
        <div className="left-side">
          <div className="card">
            <h3>Task</h3>
            <ul>
              <li>Finish homework</li>
              <li>Review notes</li>
            </ul>
          </div>

          <div className="card">
            <h3>Goals</h3>
            <ul>
              <li>Score A in math</li>
              <li>Read 10 books this semester</li>
            </ul>
          </div>
        </div>

        <div className="right-side">
          <div className="profile-posts-header">
            <h3>Recent Posts</h3>
            <button className="btn ghost" onClick={() => setModalOpen(true)}>
              New Post
            </button>
          </div>

          <div className="profile-post-list">
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </div>

      <PostModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleAddPost} />
    </div>
  )
}
