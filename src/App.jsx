import { useEffect, useMemo, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import RightPanel from './components/RightPanel.jsx'
import WidgetCanvas from './components/WidgetCanvas.jsx'
import Profile from './pages/Profile.jsx'
import WidgetPicker from './components/WidgetPicker.jsx'
import SocialPage from './components/social/SocialPage.jsx'   // < Enew
import { loadState, saveState } from './lib/storage.js'

export default function App() {
  const [activeTab, setActiveTab] = useState('Home');      // < Enew
  const [editMode, setEditMode] = useState(false)
  const [layout, setLayout] = useState([])
  const [items, setItems] = useState([])

  // ... (bootstrap + persist same as before)

  function handleNewTask() {
    alert('New Task dialog TODO');
  }

  const user = useMemo(()=>({ nickname:'Nickname', username:'username' }),[])
  const friends = useMemo(()=>[
    { id:'1', name:'Alice', status:'online', activity:'Study' },
    { id:'2', name:'Ben', status:'offline' },
    { id:'3', name:'Chika', status:'offline' },
  ],[])

  return (
    <div className="container">
      <Navbar
        activeTab={activeTab}
        onChangeTab={setActiveTab}       // < Eallow tab switching
        onNewTask={handleNewTask}
      />

      {/* Left content */}
      <main className="canvas-wrap">
        {activeTab === 'Home' && (
          <>
            <div className="canvas-toolbar">
              <button className="btn ghost" onClick={()=>setEditMode(m=>!m)}>{editMode?'Exit Edit':'Edit'}</button>
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
        {activeTab === 'Calendar' && <div>Calendar (coming soon)</div>}
      </main>

      <RightPanel user={user} friends={friends} />
    </div>
  )
}

