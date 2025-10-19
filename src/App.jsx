import { useState } from 'react'
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from './components/Navbar.jsx'
import RightPanel from './components/RightPanel.jsx'
import Profile from './pages/Profile.jsx'
import SocialPage from './components/social/SocialPage.jsx'
import Tools from './pages/Tools.jsx'
import CalendarPage from './components/CalendarPage.jsx'
import ImmerseMode from './pages/ImmerseMode.jsx'
import HomeDashboard from './components/HomeDashboard.jsx'
import { profiles, getProfileById, getProfilesExcept } from './lib/profiles.js'
import { getPosts } from './lib/posts.js'

const CURRENT_USER_ID = 1

const presenceByUserId = {
  2: { status: 'online', activity: 'Pair programming' },
  3: { status: 'offline', activity: 'Sketching ideas' },
  4: { status: 'online', activity: 'Soldering PCB' },
  5: { status: 'offline', activity: 'Language review' },
}

const derivedFriends = getProfilesExcept(CURRENT_USER_ID).map(profile => {
  const presence = presenceByUserId[profile.id] ?? { status: 'offline', activity: 'Offline' }
  return {
    ...profile,
    status: presence.status,
    activity: presence.activity,
  }
})

function ProfileWrapper({ currentUserId, posts, onCreatePost, onSelectProfile }) {
  const { id } = useParams()
  const profileId = id ? Number(id) : currentUserId
  return (
    <Profile
      profileId={profileId}
      currentUserId={currentUserId}
      posts={posts}
      onCreatePost={onCreatePost}
      onSelectProfile={onSelectProfile}
    />
  )
}

export default function App() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [posts, setPosts] = useState(() =>
    getPosts().map(post => ({
      ...post,
      author: getProfileById(post.userId),
    }))
  )

  const currentUser = getProfileById(CURRENT_USER_ID) ?? profiles[0]
  const friends = derivedFriends
  const showRightPanel = location.pathname.startsWith('/social') || location.pathname.startsWith('/profile')
  const containerClass = showRightPanel ? 'container has-sidebar' : 'container'

  function handleNewTask() {
    alert(t('app.newTaskDialog'))
  }

  function openProfile(profileId) {
    navigate(`/profile/${profileId}`)
  }

  function handleLaunchTool(toolId) {
    if (toolId === 'immerse') {
      navigate('/immerse')
      return
    }
    if (toolId === 'calendar') {
      navigate('/calendar')
      return
    }
    console.info('Launch tool placeholder:', toolId)
  }

  function handleCloseImmerse() {
    navigate(-1)
  }

  function handleCreatePost(draft) {
    if (!draft) return
    const author = getProfileById(CURRENT_USER_ID) ?? currentUser ?? profiles[0]
    const id = typeof draft.id === 'string' && draft.id ? draft.id : `local-${Date.now()}`
    const contentParts = []
    if (draft.text && draft.text.trim()) contentParts.push(draft.text.trim())
    if (draft.book && draft.book.trim()) contentParts.push(`Book: ${draft.book.trim()}`)
    if (draft.duration && draft.duration.trim()) contentParts.push(`Duration: ${draft.duration.trim()}`)
    const content = contentParts.join('\n\n') || 'Shared a new update.'
    const tags = []
    if (draft.subject && draft.subject.trim()) tags.push(draft.subject.trim())

    setPosts(prev => [
      {
        id,
        userId: author.id,
        author,
        content,
        image: draft.image ?? null,
        likes: draft.likes ?? 0,
        comments: draft.comments ?? 0,
        timestamp: new Date().toISOString(),
        tags,
      },
      ...prev,
    ])
  }

  return (
    <div className={containerClass}>
      <Navbar onNewTask={handleNewTask} />

      <main className="canvas-wrap">
        <Routes>
          <Route
            path="/"
            element={
              <HomeDashboard
                user={currentUser}
                onOpenProfile={() => openProfile(CURRENT_USER_ID)}
              />
            }
          />
          <Route
            path="/social"
            element={
              <SocialPage
                currentUser={currentUser}
                posts={posts}
                onCreatePost={handleCreatePost}
                onSelectProfile={openProfile}
              />
            }
          />
          <Route
            path="/profile"
            element={
              <Profile
                profileId={CURRENT_USER_ID}
                currentUserId={CURRENT_USER_ID}
                posts={posts}
                onCreatePost={handleCreatePost}
                onSelectProfile={openProfile}
              />
            }
          />
          <Route
            path="/profile/:id"
            element={
              <ProfileWrapper
                currentUserId={CURRENT_USER_ID}
                posts={posts}
                onCreatePost={handleCreatePost}
                onSelectProfile={openProfile}
              />
            }
          />
          <Route path="/tools" element={<Tools onLaunchTool={handleLaunchTool} />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/immerse" element={<ImmerseMode onClose={handleCloseImmerse} />} />
        </Routes>
      </main>

      {showRightPanel && (
        <RightPanel user={currentUser} friends={friends} onSelectUser={openProfile} />
      )}
    </div>
  )
}
