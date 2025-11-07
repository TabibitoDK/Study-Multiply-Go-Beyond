import { useTranslation } from 'react-i18next'
import { AlarmClock, Clock, ListTodo } from 'lucide-react'

const CATALOG = [
  { type: 'clock', titleKey: 'widgets.clock.name', icon: Clock, default: { w: 3, h: 3, minW: 3, minH: 3 } },
  { type: 'timer', titleKey: 'widgets.timer.name', icon: AlarmClock, default: { w: 5, h: 4, minW: 5, minH: 4 } },
  { type: 'todo', titleKey: 'widgets.todo.name', icon: ListTodo, default: { w: 4, h: 4, minW: 4, minH: 4 } },
]

export default function WidgetPicker({ onAdd }) {
  const { t } = useTranslation()

  return (
    <div className="row">
      {CATALOG.map(widget => {
        const Icon = widget.icon
        const label = t(widget.titleKey)
        const title = t('widgetPicker.add', { name: label })
        return (
          <button
            key={widget.type}
            className="btn ghost"
            onClick={() => onAdd?.(widget)}
            title={title}
            type="button"
          >
            <Icon size={16} style={{ marginRight: 6 }} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
