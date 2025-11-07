import { useMemo, useRef, useState } from 'react'
import { CheckCircle2, Circle, Plus, Settings, Trash2, ChevronDown } from 'lucide-react'

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export default function TodoWidget() {
  const [text, setText] = useState('')
  const [items, setItems] = useState([])
  const inputRef = useRef(null)

  function addItem(event) {
    event.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    setItems(list => [...list, { id: createId(), text: trimmed, done: false }])
    setText('')
  }

  function toggle(id) {
    setItems(list => list.map(item => item.id === id ? { ...item, done: !item.done } : item))
  }

  function remove(id) {
    setItems(list => list.filter(item => item.id !== id))
  }

  function focusInput() {
    inputRef.current?.focus()
  }

  const remaining = useMemo(() => items.filter(item => !item.done).length, [items])

  return (
    <div className="todo-widget">
      <div className="todo-header-bar">
        <div className="todo-label">
          <span className="todo-label-title">Today</span>
          <ChevronDown size={14} aria-hidden />
        </div>
        <div className="todo-header-actions">
          <button type="button" className="todo-icon-btn" onClick={focusInput} title="Add task">
            <Plus size={16} />
          </button>
          <button type="button" className="todo-icon-btn" title="Settings">
            <Settings size={16} />
          </button>
        </div>
      </div>

      <form className="todo-input-row" onSubmit={addItem}>
        <input
          ref={inputRef}
          className="todo-input"
          placeholder="Add a task and press Enter"
          value={text}
          onChange={event => setText(event.target.value)}
        />
        <button type="submit" className="todo-submit" aria-label="Add task">
          <Plus size={18} />
        </button>
      </form>

      <div className="todo-list" role="list">
        {items.map(item => (
          <div key={item.id} className={`todo-item ${item.done ? 'is-done' : ''}`} role="listitem">
            <button
              type="button"
              className="todo-toggle"
              onClick={() => toggle(item.id)}
              aria-pressed={item.done}
              aria-label={item.done ? 'Mark as not done' : 'Mark as done'}
            >
              {item.done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
            </button>
            <div className="todo-text">{item.text}</div>
            <button type="button" className="todo-remove" onClick={() => remove(item.id)} aria-label="Delete task">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="todo-empty">Plan your day - add a task above.</div>
        )}
      </div>

      <div className="todo-footer">
        <span>{remaining} task{remaining === 1 ? '' : 's'} remaining</span>
      </div>
    </div>
  )
}


