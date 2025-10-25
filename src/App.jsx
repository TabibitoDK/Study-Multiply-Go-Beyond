import { useState } from 'react'
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from './components/Navbar.jsx'
import CalendarTopbar from './components/CalendarTopbar.jsx'
import ToolTopbar from './components/ToolTopbar.jsx'
import RightPanel from './components/RightPanel.jsx'
import Profile from './pages/Profile.jsx'
import SocialPage from './components/social/SocialPage.jsx'
import Chat from './pages/Chat.jsx'
import Tools from './pages/Tools.jsx'
import CalendarPage from './components/CalendarPage.jsx'
import ImmerseMode from './pages/ImmerseMode.jsx'
import HomeDashboard from './components/HomeDashboard.jsx'
import Library from './pages/Library.jsx'
import BookDetails from './pages/BookDetails.jsx'
import ToolPlaceholder from './pages/ToolPlaceholder.jsx'
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

const groups = [
  { id: 'g1', name: 'Study Group - Math', memberCount: 5, image: null },
  { id: 'g2', name: 'Project Team Alpha', memberCount: 8, image: null },
  { id: 'g3', name: 'Language Exchange', memberCount: 12, image: null },
]

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)

  const currentUser = getProfileById(CURRENT_USER_ID) ?? profiles[0]
  const friends = derivedFriends
  const showRightPanel = location.pathname === '/' || location.pathname.startsWith('/tools') || location.pathname.startsWith('/social') || location.pathname.startsWith('/profile') || location.pathname.startsWith('/chat') || location.pathname.startsWith('/library')
  const isCalendarApp = location.pathname.startsWith('/calendar')

  // Check if it's a tool page (but not immerse)
  const toolMatch = location.pathname.match(/^\/tools\/(flashcards|summary|pomodoro|aichat)$/)
  const isToolPage = toolMatch !== null
  const toolId = toolMatch ? toolMatch[1] : null

  let containerClass = 'container'
  if (showRightPanel) {
    containerClass = sidebarCollapsed ? 'container has-sidebar-collapsed' : 'container has-sidebar'
  }

  function handleNewTask() {
    alert(t('app.newTaskDialog'))
  }

  function openProfile(profileId) {
    navigate(`/profile/${profileId}`)
  }

  function openChat(id, type) {
    navigate(`/chat/${type}/${id}`)
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
      {isCalendarApp ? (
        <CalendarTopbar />
      ) : isToolPage ? (
        <ToolTopbar toolId={toolId} />
      ) : (
        <Navbar onNewTask={handleNewTask} />
      )}

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
          <Route
            path="/chat/:type/:id"
            element={<Chat currentUserId={CURRENT_USER_ID} friends={friends} groups={groups} />}
          />
          <Route path="/library" element={<Library />} />
          <Route path="/library/:id" element={<BookDetails />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/tools/flashcards" element={<ToolPlaceholder toolId="flashcards" />} />
          <Route path="/tools/summary" element={<ToolPlaceholder toolId="summary" />} />
          <Route path="/tools/pomodoro" element={<ToolPlaceholder toolId="pomodoro" />} />
          <Route path="/tools/aichat" element={<ToolPlaceholder toolId="aichat" />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/immerse" element={<ImmerseMode onClose={handleCloseImmerse} />} />
        </Routes>
      </main>

      {showRightPanel && (
        <RightPanel
          friends={friends}
          groups={groups}
          onOpenChat={openChat}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={setSidebarCollapsed}
        />
      )}
    </div>
  )
}
