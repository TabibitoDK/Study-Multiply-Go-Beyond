import { useState } from 'react'
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

export default function App() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('home')
  const [selectedProfileId, setSelectedProfileId] = useState(CURRENT_USER_ID)
  const [immersiveModeOpen, setImmersiveModeOpen] = useState(false)
  const [posts, setPosts] = useState(() =>
    getPosts().map(post => ({
      ...post,
      author: getProfileById(post.userId),
    }))
  )

  const currentUser = getProfileById(CURRENT_USER_ID) ?? profiles[0]
  const friends = derivedFriends
  const showRightPanel = activeTab === 'social' || activeTab === 'profile'
  const containerClass = showRightPanel ? 'container has-sidebar' : 'container'

  function handleNewTask() {
    alert(t('app.newTaskDialog'))
  }

  function handleChangeTab(tab) {
    setActiveTab(tab)
    if (tab === 'profile') {
      setSelectedProfileId(CURRENT_USER_ID)
    }
  }

  function openProfile(profileId) {
    setSelectedProfileId(profileId)
    setActiveTab('profile')
  }

  function handleLaunchTool(toolId) {
    if (toolId === 'immerse') {
      setImmersiveModeOpen(true)
      return
    }
    if (toolId === 'calendar') {
      setActiveTab('calendar')
      return
    }
    console.info('Launch tool placeholder:', toolId)
  }

  function handleCloseImmerse() {
    setImmersiveModeOpen(false)
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
      <Navbar activeTab={activeTab} onChangeTab={handleChangeTab} onNewTask={handleNewTask} />

      <main className="canvas-wrap">
        {activeTab === 'home' && (
          <HomeDashboard
            user={currentUser}
            onNavigate={handleChangeTab}
            onOpenProfile={() => openProfile(CURRENT_USER_ID)}
          />
        )}

        {activeTab === 'social' && (
          <SocialPage
            posts={posts}
            onCreatePost={handleCreatePost}
            onSelectProfile={openProfile}
          />
        )}

        {activeTab === 'profile' && (
          <Profile
            profileId={selectedProfileId}
            currentUserId={CURRENT_USER_ID}
            posts={posts}
            onCreatePost={handleCreatePost}
            onSelectProfile={openProfile}
          />
        )}
        {activeTab === 'tools' && <Tools onLaunchTool={handleLaunchTool} />}
        {activeTab === 'calendar' && (
          <CalendarPage onNavigate={handleChangeTab} />
        )}
      </main>

      {showRightPanel && (
        <RightPanel user={currentUser} friends={friends} onSelectUser={openProfile} />
      )}

      {immersiveModeOpen && <ImmerseMode onClose={handleCloseImmerse} />}
    </div>
  )
}
