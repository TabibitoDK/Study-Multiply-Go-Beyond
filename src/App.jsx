import { useMemo, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import RightPanel from './components/RightPanel.jsx'
import WidgetCanvas from './components/WidgetCanvas.jsx'
import Profile from './pages/Profile.jsx'
import WidgetPicker from './components/WidgetPicker.jsx'
import SocialPage from './components/social/SocialPage.jsx'
import CalendarPage from './components/CalendarPage.jsx'

export default function App() {
  const [activeTab, setActiveTab] = useState('Home')
  const [editMode, setEditMode] = useState(false)
  const [layout, setLayout] = useState([])
  const [items, setItems] = useState([])

  // TODO: restore bootstrap + persistence using loadState/saveState if needed

  function handleNewTask() {
    alert('New Task dialog TODO')
  }

  function addWidgetFromCatalog(widget) {
    const size = widget?.default ?? { w: 4, h: 3 }
    const cryptoApi = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined
    const idBase =
      cryptoApi && typeof cryptoApi.randomUUID === 'function'
        ? `${widget.type}-${cryptoApi.randomUUID()}`
        : `${widget.type}-${Date.now()}`

    setLayout(prevLayout => {
      const nextY = prevLayout.reduce((max, l) => Math.max(max, l.y + l.h), 0)
      return [...prevLayout, { i: idBase, x: 0, y: nextY, w: size.w, h: size.h }]
    })

    setItems(prevItems => {
      const nextY = prevItems.reduce((max, it) => Math.max(max, it.grid.y + it.grid.h), 0)
      const grid = { x: 0, y: nextY, w: size.w, h: size.h }
      return [...prevItems, { id: idBase, type: widget.type, title: widget?.name ?? widget.type, grid }]
    })
  }

  const user = useMemo(() => ({ nickname: 'Nickname', username: 'username' }), [])
  const friends = useMemo(
    () => [
      { id: '1', name: 'Alice', status: 'online', activity: 'Study' },
      { id: '2', name: 'Ben', status: 'offline' },
      { id: '3', name: 'Chika', status: 'offline' }
    ],
    []
  )

  return (
    <div className="container">
      <Navbar activeTab={activeTab} onChangeTab={setActiveTab} onNewTask={handleNewTask} />

      {/* Left content */}
      <main className="canvas-wrap">
        {activeTab === 'Home' && (
          <>
            <div className="canvas-toolbar">
              <button className="btn ghost" onClick={() => setEditMode(m => !m)}>
                {editMode ? 'Exit Edit' : 'Edit'}
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

        {activeTab === 'Social' && <SocialPage />}

        {activeTab === 'Profile' && <Profile />}
        {activeTab === 'Calendar' && <CalendarPage />}
      </main>

      <RightPanel user={user} friends={friends} />
    </div>
  )
}



