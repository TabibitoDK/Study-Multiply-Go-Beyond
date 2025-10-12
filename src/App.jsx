import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from './components/Navbar.jsx'
import RightPanel from './components/RightPanel.jsx'
import WidgetCanvas from './components/WidgetCanvas.jsx'
import Profile from './pages/Profile.jsx'
import WidgetPicker from './components/WidgetPicker.jsx'
import SocialPage from './components/social/SocialPage.jsx'
import CalendarPage from './components/CalendarPage.jsx'
import Tools from './pages/Tools.jsx'
import ImmerseMode from './pages/ImmerseMode.jsx'
import { profiles, getProfileById, getProfilesExcept } from './lib/profiles.js'

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
  const [editMode, setEditMode] = useState(false)
  const [layout, setLayout] = useState([])
  const [items, setItems] = useState([])
  const [selectedProfileId, setSelectedProfileId] = useState(CURRENT_USER_ID)
  const [immersiveModeOpen, setImmersiveModeOpen] = useState(false)

  const currentUser = getProfileById(CURRENT_USER_ID) ?? profiles[0]
  const friends = derivedFriends

  function handleNewTask() {
    alert(t('app.newTaskDialog'))
  }

  function handleChangeTab(tab) {
    setActiveTab(tab)
    if (tab === 'profile') {
      setSelectedProfileId(CURRENT_USER_ID)
    }
  }

  function addWidgetFromCatalog(widget) {
    const size = widget?.default ?? { w: 4, h: 3 }
    const cryptoApi = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined
    const idBase =
      cryptoApi && typeof cryptoApi.randomUUID === 'function'
        ? `${widget.type}-${cryptoApi.randomUUID()}`
        : `${widget.type}-${Date.now()}`

    const baseW = typeof size.w === 'number' ? size.w : 4
    const baseH = typeof size.h === 'number' ? size.h : 3
    const minW = typeof size.minW === 'number' ? size.minW : baseW
    const minH = typeof size.minH === 'number' ? size.minH : baseH
    const widthUnits = Math.max(baseW, minW)
    const heightUnits = Math.max(baseH, minH)

    setLayout(prevLayout => {
      const cols = 12
      const perRow = Math.max(1, Math.floor(cols / Math.max(1, widthUnits)))
      const index = prevLayout.length
      const x = (index % perRow) * widthUnits
      const y = Math.floor(index / perRow) * heightUnits
      return [...prevLayout, { i: idBase, x, y, w: widthUnits, h: heightUnits }]
    })

    setItems(prevItems => {
      const cols = 12
      const perRow = Math.max(1, Math.floor(cols / Math.max(1, widthUnits)))
      const index = prevItems.length
      const x = (index % perRow) * widthUnits
      const y = Math.floor(index / perRow) * heightUnits
      const grid = { x, y, w: widthUnits, h: heightUnits }
      const titleKey = widget?.titleKey ?? null
      const fallbackTitle = titleKey ? t(titleKey) : widget?.name ?? widget.type
      return [
        ...prevItems,
        { id: idBase, type: widget.type, titleKey, title: fallbackTitle, grid },
      ]
    })
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
    console.info('Launch tool placeholder:', toolId)
  }

  function handleCloseImmerse() {
    setImmersiveModeOpen(false)
  }

  return (
    <div className="container">
      <Navbar activeTab={activeTab} onChangeTab={handleChangeTab} onNewTask={handleNewTask} />

      <main className="canvas-wrap">
        {activeTab === 'home' && (
          <>
            <div className="canvas-toolbar">
              <button className="btn ghost" onClick={() => setEditMode(m => !m)}>
                {editMode ? t('buttons.exitEdit') : t('buttons.edit')}
              </button>
              {editMode && <WidgetPicker onAdd={addWidgetFromCatalog} />}
            </div>
            <WidgetCanvas
              editMode={editMode}
              layout={layout}
              setLayout={setLayout}
              items={items}
              setItems={setItems}
            />
          </>
        )}

        {activeTab === 'social' && <SocialPage onSelectProfile={openProfile} />}

        {activeTab === 'profile' && (
          <Profile
            profileId={selectedProfileId}
            currentUserId={CURRENT_USER_ID}
            onSelectProfile={openProfile}
          />
        )}
        {activeTab === 'calendar' && <CalendarPage />}
        {activeTab === 'tools' && <Tools onLaunchTool={handleLaunchTool} />}
      </main>

      <RightPanel user={currentUser} friends={friends} onSelectUser={openProfile} />

      {immersiveModeOpen && <ImmerseMode onClose={handleCloseImmerse} />}
    </div>
  )
}
