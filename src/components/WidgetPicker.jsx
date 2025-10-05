import { AlarmClock, Clock, ListTodo } from 'lucide-react'

const CATALOG = [
  { type: 'clock', name: 'Clock', icon: Clock, default: { w: 3, h: 3, minW: 3, minH: 3 } },
  { type: 'timer', name: 'Timer', icon: AlarmClock, default: { w: 5, h: 4, minW: 5, minH: 4 } },
  { type: 'todo',  name: 'Todo',  icon: ListTodo, default: { w: 4, h: 4, minW: 4, minH: 4 } },
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



