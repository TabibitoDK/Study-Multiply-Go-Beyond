import { useState } from 'react'
import { Check, Trash2 } from 'lucide-react'

export default function TodoWidget({ title = 'Todo' }) {
  const [text, setText] = useState('')
  const [items, setItems] = useState([])

  function addItem(e) {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    setItems(list => [...list, { id: crypto.randomUUID(), text: t, done: false }])
    setText('')
  }

  function toggle(id) { setItems(list => list.map(i => i.id===id ? {...i, done:!i.done} : i)) }
  function remove(id) { setItems(list => list.filter(i => i.id!==id)) }

  return (
    <div className="widget">
      <div className="widget-header"><span>{title}</span></div>

      <form onSubmit={addItem}>
        <input className="todo-input" placeholder="Add a task and press Enter…" value={text} onChange={e=>setText(e.target.value)} />
      </form>

      <div className="todo-list">
        {items.map(i=>(
          <div key={i.id} className="todo-item">
            <input type="checkbox" checked={i.done} onChange={() => toggle(i.id)} />
            <div style={{ textDecoration: i.done ? 'line-through' : 'none' }}>{i.text}</div>
            <button className="icon-btn" onClick={() => remove(i.id)} title="Delete"><Trash2 size={16}/></button>
          </div>
        ))}
        {items.length===0 && <div style={{ color:'var(--subtext)', fontSize: 13 }}>No tasks yet.</div>}
      </div>

      <div style={{ fontSize: 12, color: 'var(--subtext)' }}>
        Tip: Press <span className="kbd">Enter</span> to add
      </div>
    </div>
  )
}
