import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom'
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
import FlowView from './pages/FlowView.jsx'
import FlashcardsPage from './tools/flashcard/FlashcardsPage.jsx'
import { StudinyChat } from './tools/studiny-chat/index.js'
import { StudyStreamRoutes } from './tools/studystream/index.js'
import './tools/studiny-chat/StudinyChat.css'
import { TaskManagerProvider } from './context/TaskManagerContext.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute.jsx'
import TaskDetails from './pages/TaskDetails.jsx'
import profileService from './services/profileService.js'
import postService from './services/postService.js'
import LoginPage from './pages/LoginPage.jsx'


const presenceByUserId = {
  2: { status: 'online', activity: 'Pair programming' },
  3: { status: 'offline', activity: 'Sketching ideas' },
  4: { status: 'online', activity: 'Soldering PCB' },
  5: { status: 'offline', activity: 'Language review' },
}

// We'll initialize these as empty arrays and fetch them dynamically
let derivedFriends = []

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

function AppContent() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [posts, setPosts] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [currentTask, setCurrentTask] = useState(null)
  const [lastCompletedTask, setLastCompletedTask] = useState(null)

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true)
        
        // Fetch posts and profiles
        const [postsData, profilesData] = await Promise.all([
          postService.getAllPosts(),
          profileService.getAllProfiles()
        ])
        
        // Enrich posts with author profiles
        const enrichedPosts = await Promise.all(
          postsData.map(async (post) => {
            try {
              const author = profilesData.find(p => p.id === post.userId) ||
                             await profileService.getProfileById(post.userId)
              return {
                ...post,
                author
              }
            } catch (err) {
              console.error(`Error fetching author for post ${post.id}:`, err)
              return {
                ...post,
                author: null
              }
            }
          })
        )
        
        setPosts(enrichedPosts)
        setProfiles(profilesData)
        
        // Create derived friends list (excluding current user)
        const currentUserId = user?._id || user?.id || 1
        derivedFriends = profilesData
          .filter(profile => profile.id !== currentUserId)
          .map(profile => {
            const presence = presenceByUserId[profile.id] ?? { status: 'offline', activity: 'Offline' }
            return {
              ...profile,
              status: presence.status,
              activity: presence.activity,
            }
          })
        
        setLoading(false)
      } catch (err) {
        console.error('Error fetching initial data:', err)
        setLoading(false)
      }
    }

    if (user) {
      fetchInitialData()
    } else {
      setLoading(false)
    }
  }, [user])

  // Use authenticated user or fallback to first profile for demo
  const currentUser = user ? {
    ...user,
    id: user._id || user.id,
    name: user.username || user.name,
    profileImage: user.profileImage || profiles[0]?.profileImage
  } : profiles[0] || { id: 1, name: 'Demo User' }
  
  const friends = derivedFriends
  const isLoginPage = location.pathname.startsWith('/login')
  const showRightPanel = !isLoginPage && (location.pathname === '/' || location.pathname.startsWith('/tools') || location.pathname.startsWith('/social') || location.pathname.startsWith('/profile') || location.pathname.startsWith('/chat') || location.pathname.startsWith('/library'))
  const isCalendarApp = location.pathname.startsWith('/calendar')

  // Check if it's a tool page (but not immerse)
  const toolMatch = location.pathname.match(/^\/tools\/(flashcards|chat|stream)/)
  const isToolPage = toolMatch !== null
  const toolId = toolMatch ? toolMatch[1] : null

  let containerClass = isLoginPage ? 'login-standalone' : 'container'
  if (!isLoginPage && showRightPanel) {
    containerClass = sidebarCollapsed ? 'container has-sidebar-collapsed' : 'container has-sidebar'
  }
  const mainClassName = isLoginPage ? 'login-main' : 'canvas-wrap'

  function openProfile(profileId) {
    navigate(`/profile/${profileId}`)
  }

  function openChat(id, type) {
    navigate(`/chat/${type}/${id}`)
  }

  function handleCloseImmerse() {
    navigate(-1)
  }

  async function handleCreatePost(draft) {
    if (!draft) return
    const author = currentUser
    
    try {
      const contentParts = []
      if (draft.text && draft.text.trim()) contentParts.push(draft.text.trim())
      if (draft.book && draft.book.trim()) contentParts.push(`Book: ${draft.book.trim()}`)
      if (draft.duration && draft.duration.trim()) contentParts.push(`Duration: ${draft.duration.trim()}`)
      const content = contentParts.join('\n\n') || 'Shared a new update.'
      const tags = []
      if (draft.subject && draft.subject.trim()) tags.push(draft.subject.trim())

      const postData = {
        userId: author.id,
        content,
        image: draft.image ?? null,
        likes: draft.likes ?? 0,
        comments: draft.comments ?? 0,
        timestamp: new Date().toISOString(),
        tags,
      }

      // Create post via API
      const newPost = await postService.createPost(postData)
      
      // Add author info to the new post
      const enrichedPost = {
        ...newPost,
        author
      }
      
      setPosts(prev => [enrichedPost, ...prev])
    } catch (err) {
      console.error('Error creating post:', err)
      // Fallback to local state if API fails
      const id = `local-${Date.now()}`
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
  }

  function handleSetCurrentTask(taskTitle) {
    if (!taskTitle) return
    setCurrentTask({
      title: taskTitle,
      startedAt: new Date().toISOString(),
    })
  }

  function handleCompleteTask(taskTitle, timeSpent) {
    if (!taskTitle) return
    setLastCompletedTask({
      title: taskTitle,
      timeSpent: timeSpent ?? null,
      completedAt: new Date().toISOString(),
    })
    setCurrentTask(prev => {
      if (!prev) return null
      return prev.title === taskTitle ? null : prev
    })
  }

  return (
    <TaskManagerProvider>
      <div className={containerClass}>
        {!isLoginPage &&
          (isCalendarApp ? (
            <CalendarTopbar />
          ) : isToolPage ? (
            <ToolTopbar toolId={toolId} />
          ) : (
            <Navbar currentTask={currentTask} lastCompletedTask={lastCompletedTask} />
          ))}

        <main className={mainClassName}>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomeDashboard
                    user={currentUser}
                    onOpenProfile={() => openProfile(currentUser.id)}
                    currentTask={currentTask}
                    onSetCurrentTask={handleSetCurrentTask}
                    onCompleteTask={handleCompleteTask}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/social"
              element={
                <ProtectedRoute>
                  <SocialPage
                    currentUser={currentUser}
                    posts={posts}
                    onCreatePost={handleCreatePost}
                    onSelectProfile={openProfile}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile
                    profileId={currentUser.id}
                    currentUserId={currentUser.id}
                    posts={posts}
                    onCreatePost={handleCreatePost}
                    onSelectProfile={openProfile}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:id"
              element={
                <ProtectedRoute>
                  <ProfileWrapper
                    currentUserId={currentUser.id}
                    posts={posts}
                    onCreatePost={handleCreatePost}
                    onSelectProfile={openProfile}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/:type/:id"
              element={
                <ProtectedRoute>
                  <Chat currentUserId={currentUser.id} friends={friends} groups={groups} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/library"
              element={
                <ProtectedRoute>
                  <Library />
                </ProtectedRoute>
              }
            />
            <Route
              path="/library/:id"
              element={
                <ProtectedRoute>
                  <BookDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/tools"
              element={
                <ProtectedRoute>
                  <Tools />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tools/flashcards"
              element={
                <ProtectedRoute>
                  <FlashcardsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tools/chat"
              element={
                <ProtectedRoute>
                  <StudinyChat title="Studiny Chat" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tools/stream/*"
              element={
                <ProtectedRoute>
                  <StudyStreamRoutes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <CalendarPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/immerse"
              element={
                <ProtectedRoute>
                  <ImmerseMode onClose={handleCloseImmerse} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks/:taskId"
              element={
                <ProtectedRoute>
                  <TaskDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/plans/:planId/flow"
              element={
                <ProtectedRoute>
                  <FlowView />
                </ProtectedRoute>
              }
            />
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
    </TaskManagerProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
