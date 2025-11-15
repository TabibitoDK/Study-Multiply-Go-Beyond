import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom'
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
import BookRelatedPosts from './pages/BookRelatedPosts.jsx'
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
import groupService from './services/groupService.js'
import LoginPage from './pages/LoginPage.jsx'
import DemoFriends from './pages/DemoFriends.jsx'
import { Spinner } from './components/Spinner.jsx'

const FRIEND_STATUS_PRESETS = {
  haruto_study: { status: 'online', activity: 'Slide rewrites' },
  sora_english: { status: 'online', activity: 'Timing intro' },
  miyu_gakushu: { status: 'offline', activity: 'Drafting feedback' },
  ren_math: { status: 'offline', activity: 'Mock Q&A later' },
}



function ProfileWrapper({ currentUserId, posts, onCreatePost, onSelectProfile }) {
  const { id } = useParams()
  const profileId = id ?? currentUserId
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
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [posts, setPosts] = useState([])
  const [profiles, setProfiles] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [friends, setFriends] = useState([])
  const [groups, setGroups] = useState([])
  const [, setDataLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [currentTask, setCurrentTask] = useState(null)
  const [lastCompletedTask, setLastCompletedTask] = useState(null)

  const buildFriendProfiles = useCallback((currentProfile, profileMap) => {
    if (!currentProfile?.followingIds?.length) {
      return []
    }

    return currentProfile.followingIds
      .map(id => profileMap.get(id))
      .filter(Boolean)
      .map(profile => {
        const key = profile.username || profile.name || ''
        const preset = FRIEND_STATUS_PRESETS[key] || {}
        return {
          ...profile,
          status: preset.status || 'offline',
          activity: preset.activity || 'Offline',
        }
      })
  }, [])

  const refreshFriends = useCallback(async () => {
    if (!user) {
      setFriends([])
      return
    }

    try {
      const authUserId = user._id || user.id
      const [profileList, currentProfileData] = await Promise.all([
        profileService.getAllProfiles(),
        profileService.getProfileById(authUserId).catch(() => null),
      ])

      const profileMap = new Map((profileList || []).map(profile => [profile.userId, profile]))
      if (currentProfileData) {
        profileMap.set(currentProfileData.userId, currentProfileData)
        setUserProfile(currentProfileData)
      }

      setProfiles(Array.from(profileMap.values()))
      setFriends(buildFriendProfiles(currentProfileData, profileMap))
    } catch (err) {
      console.error('Error refreshing friend list:', err)
    }
  }, [user, buildFriendProfiles])

  const refreshGroups = useCallback(async () => {
    if (!user) {
      setGroups([])
      return
    }

    try {
      const groupList = await groupService.getMyGroups()
      setGroups(groupList)
    } catch (err) {
      console.error('Error refreshing study groups:', err)
    }
  }, [user])

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) {
        setPosts([])
        setProfiles([])
        setUserProfile(null)
        setFriends([])
        setGroups([])
        setDataLoading(false)
        return
      }

      try {
        setDataLoading(true)
        const authUserId = user._id || user.id

        const [publicPosts, profileList, currentProfile] = await Promise.all([
          postService.getAllPosts(),
          profileService.getAllProfiles(),
          profileService.getProfileById(authUserId).catch(() => null),
        ])

        const profileMap = new Map((profileList || []).map(profile => [profile.userId, profile]))

        if (currentProfile) {
          profileMap.set(currentProfile.userId, currentProfile)
        }

        const postsWithAuthors = publicPosts.map(post => {
          if (post.author) {
            return post
          }

          const authorProfile = profileMap.get(post.userId)
          return {
            ...post,
            author: authorProfile ?? post.author ?? null,
          }
        })

        setPosts(postsWithAuthors)
        setProfiles(Array.from(profileMap.values()))
        setUserProfile(currentProfile)

        const friendProfiles = buildFriendProfiles(currentProfile, profileMap)
        setFriends(friendProfiles)
      } catch (err) {
        console.error('Error fetching initial data:', err)
      } finally {
        setDataLoading(false)
      }
    }

    fetchInitialData()
  }, [user, buildFriendProfiles])

  useEffect(() => {
    refreshGroups()
  }, [refreshGroups])

  useEffect(() => {
    if (sidebarCollapsed || !user) {
      return
    }

    let cancelled = false

    const syncConnections = async () => {
      if (cancelled) return
      await Promise.all([refreshFriends(), refreshGroups()])
    }

    syncConnections()
    const intervalId = setInterval(syncConnections, 30000)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [sidebarCollapsed, user, refreshFriends, refreshGroups])

  const authUserId = user?._id || user?.id || null
  const resolvedProfile =
    (authUserId && profiles.find(profile => profile.userId === authUserId)) ||
    userProfile ||
    null

  const currentUser = resolvedProfile
    ? { ...resolvedProfile, id: resolvedProfile.userId }
    : user
      ? {
          ...user,
          id: authUserId,
          name: user.username || user.name || user.email,
          username: user.username || user.name || '',
          profileImage: user.profileImage || '',
        }
      : { id: null, name: '', username: '', profileImage: '' }

  const isLoginPage = location.pathname.startsWith('/login')
  const showRightPanel = !isLoginPage && (location.pathname === '/' || location.pathname.startsWith('/tools') || location.pathname.startsWith('/social') || location.pathname.startsWith('/profile') || location.pathname.startsWith('/chat') || location.pathname.startsWith('/library'))
  const isCalendarApp = location.pathname.startsWith('/calendar')

  // Check if it's a tool page (but not immerse)
  const toolMatch = location.pathname.match(/^\/tools\/(flashcards|chat|stream)/)
  const isToolPage = toolMatch !== null
  const toolId = toolMatch ? toolMatch[1] : null

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--canvas, #fff)',
        }}
      >
        <Spinner size="large" />
      </div>
    )
  }

  if (!isAuthenticated && !isLoginPage) {
    return <Navigate to="/login" replace />
  }

  let containerClass = isLoginPage ? 'login-standalone' : 'container'
  if (!isLoginPage && showRightPanel) {
    containerClass = sidebarCollapsed ? 'container has-sidebar-collapsed' : 'container has-sidebar'
  }
  const mainClassName = isLoginPage ? 'login-main' : 'canvas-wrap'

  function openProfile(profileId) {
    if (!profileId) return
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

    try {
      const segments = []
      if (draft.text?.trim()) segments.push(draft.text.trim())
      if (draft.book?.trim()) segments.push('Book: ' + draft.book.trim())
      if (draft.duration?.trim()) segments.push('Duration: ' + draft.duration.trim())
      const tags = draft.subject?.trim() ? [draft.subject.trim()] : []

      const payload = {
        content: segments.join('\n\n') || 'Shared a new update.',
        tags,
        books: [],
        visibility: 'public',
      }

      const createdPost = await postService.createPost(payload)
      const authorProfile = currentUser
        ? {
            id: currentUser.id,
            name: currentUser.name || currentUser.username || currentUser.email,
            username: currentUser.username || currentUser.name || '',
            profileImage: currentUser.profileImage || '',
          }
        : null

      setPosts(prev => [
        {
          ...createdPost,
          author: authorProfile ?? createdPost.author ?? null,
        },
        ...prev,
      ])
    } catch (error) {
      console.error('Error creating post:', error)
      const fallbackId = 'local-' + Date.now()
      const segments = []
      if (draft.text?.trim()) segments.push(draft.text.trim())
      if (draft.book?.trim()) segments.push('Book: ' + draft.book.trim())
      if (draft.duration?.trim()) segments.push('Duration: ' + draft.duration.trim())
      const tags = draft.subject?.trim() ? [draft.subject.trim()] : []

      setPosts(prev => [
        {
          id: fallbackId,
          userId: currentUser?.id,
          content: segments.join('\n\n') || 'Shared a new update.',
          tags,
          books: [],
          likes: 0,
          comments: 0,
          timestamp: new Date().toISOString(),
          author: currentUser
            ? {
                id: currentUser.id,
                name: currentUser.name || currentUser.username || currentUser.email,
                username: currentUser.username || currentUser.name || '',
                profileImage: currentUser.profileImage || '',
              }
            : null,
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
              path="/library/:id/related-posts"
              element={
                <ProtectedRoute>
                  <BookRelatedPosts />
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
            <Route
              path="/demo/friends"
              element={
                <ProtectedRoute>
                  <DemoFriends />
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
