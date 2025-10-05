import { AlarmClock, Clock, ListTodo } from 'lucide-react'

const CATALOG = [
  { type: 'clock', name: 'Clock', icon: Clock, default: { w: 4, h: 3 } },
  { type: 'timer', name: 'Timer', icon: AlarmClock, default: { w: 4, h: 3 } },
  { type: 'todo',  name: 'Todo',  icon: ListTodo, default: { w: 4, h: 5 } },
]

export default function WidgetPicker({ onAdd }) {
  return (
    <div className="row">
      {CATALOG.map(w=>{
        const I = w.icon
        return (
          <button
            key={w.type}
            className="btn ghost"
            onClick={()=>onAdd(w)}
            title={`Add ${w.name}`}
          >
            <I size={16} style={{ marginRight: 6 }} />
            {w.name}
          </button>
        )
      })}
    </div>
  )
}
