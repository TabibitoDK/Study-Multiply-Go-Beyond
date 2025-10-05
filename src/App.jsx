import { useEffect, useMemo, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import RightPanel from './components/RightPanel.jsx'
import WidgetCanvas from './components/WidgetCanvas.jsx'
import WidgetPicker from './components/WidgetPicker.jsx'
import { loadState, saveState } from './lib/storage.js'

export default function App() {
  const [editMode, setEditMode] = useState(false)
  const [layout, setLayout] = useState([])
  const [items, setItems] = useState([])

  // Bootstrap from localStorage
  useEffect(() => {
    const s = loadState()
    if (s) { setLayout(s.layout ?? []); setItems(s.items ?? []) }
    else {
      // default starter widgets
      const id1 = crypto.randomUUID()
      const id2 = crypto.randomUUID()
      setItems([
        { id: id1, type: 'clock', title: 'Clock', grid: { x:0,y:0,w:4,h:4 } },
        { id: id2, type: 'timer', title: 'Study Timer', grid: { x:4,y:0,w:4,h:4 } },
      ])
      setLayout([
        { i: id1, x:0,y:0,w:4,h:4 },
        { i: id2, x:4,y:0,w:4,h:4 },
      ])
    }
  }, [])

  // Persist
  useEffect(() => { saveState({ layout, items }) }, [layout, items])

  function addWidgetFromCatalog(entry) {
    const id = crypto.randomUUID()
    const grid = { x: 0, y: Infinity, w: entry.default.w, h: entry.default.h } // y=Infinity = put at bottom
    setItems([...items, { id, type: entry.type, title: entry.name, grid }])
    setLayout([...layout, { i:id, ...grid }])
  }

  const user = useMemo(()=>({
    nickname: 'Nickname',
    username: 'username'
  }),[])

  const friends = useMemo(()=>[
    { id:'1', name:'Alice', status:'online', activity:'Study' },
    { id:'2', name:'Ben', status:'offline' },
    { id:'3', name:'Chika', status:'offline' },
  ],[])

  function handleNewTask() {
    alert('New Task dialog TODO')
  }

  return (
    <div className="container">
      <Navbar onNewTask={handleNewTask} />

      {/* Canvas (left) */}
      <main className="canvas-wrap">
        <div className="canvas-toolbar">
          <button className="btn ghost" onClick={()=>setEditMode(m=>!m)}>{editMode?'Exit Edit':'Edit'}</button>
          {editMode && (
            <>
              <WidgetPicker onAdd={addWidgetFromCatalog} />
            </>
          )}
        </div>

        <WidgetCanvas
          editMode={editMode}
          layout={layout}
          setLayout={setLayout}
          items={items}
          setItems={setItems}
        />
      </main>

      {/* Right Panel */}
      <RightPanel user={user} friends={friends} />
    </div>
  )
}
