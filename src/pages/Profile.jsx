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
            <h3>Introduction</h3>
            <p className="profile-about">
              Third-year student passionate about math, languages, and helping friends stay motivated. I love building study plans that balance deep focus with creative breaks.
            </p>
          </div>

          <div className="card">
            <h3>Target Achievement</h3>
            <div className="profile-target">
              <span className="profile-target-item">University of Tokyo - Global Studies</span>
              <span className="profile-target-item">JLPT N1 Certification</span>
            </div>
          </div>

          <div className="card">
            <h3>Goals</h3>
            <div className="goal-section">
              <h4>Long-Term</h4>
              <ul className="goal-list">
                <li>Publish a study guide for multilingual learners.</li>
                <li>Complete a research internship focused on learning science.</li>
              </ul>
            </div>
            <div className="goal-section">
              <h4>Short-Term</h4>
              <ul className="goal-list">
                <li>Finish the current semester with a GPA above 3.8.</li>
                <li>Lead a weekly peer study circle for calculus.</li>
              </ul>
            </div>
          </div>

          <div className="card">
            <h3>Tasks</h3>
            <ul>
              <li>Finish homework</li>
              <li>Review notes</li>
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
