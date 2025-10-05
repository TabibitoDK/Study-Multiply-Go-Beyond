import { Responsive, WidthProvider } from 'react-grid-layout'
import { useMemo } from 'react'
import { X } from 'lucide-react'
import ClockWidget from './widgets/ClockWidget.jsx'
import TimerWidget from './widgets/TimerWidget.jsx'
import TodoWidget from './widgets/TodoWidget.jsx'

const ResponsiveGridLayout = WidthProvider(Responsive)

function WidgetShell({ id, title, canEdit, onRemove, children }) {
  return (
    <div className="widget" data-id={id}>
      <div className="widget-header">
        <span>{title}</span>
        {canEdit && (
          <button className="icon-btn" onClick={()=>onRemove(id)} title="Delete">
            <X size={16}/>
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

export default function WidgetCanvas({
  layout, setLayout,
  items, setItems,
  editMode
}) {
  const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }
  const cols =       { lg: 12,   md: 10,  sm: 8,   xs: 6,   xxs: 4 }

  const layouts = useMemo(()=> {
    // react-grid-layout expects a layouts obj for breakpoints; reuse same layout
    return Object.fromEntries(Object.keys(breakpoints).map(bp => [bp, layout]))
  }, [layout])

  function onLayoutChange(_, allLayouts) {
    // we only track the 'lg' layout persistently (works for all sizes)
    const lg = allLayouts.lg?.map(({i, x, y, w, h}) => ({i,x,y,w,h})) ?? []
    setLayout(lg)
  }

  function renderWidget(w) {
    const common = { id: w.id, title: w.title ?? w.type[0].toUpperCase()+w.type.slice(1), canEdit: editMode, onRemove: removeWidget }
    if (w.type === 'clock') return <WidgetShell {...common}><ClockWidget /></WidgetShell>
    if (w.type === 'timer') return <WidgetShell {...common}><TimerWidget /></WidgetShell>
    if (w.type === 'todo')  return <WidgetShell {...common}><TodoWidget /></WidgetShell>
    return <div>Unknown widget</div>
  }

  function removeWidget(id) {
    setItems(items.filter(it => it.id !== id))
    setLayout(layout.filter(l => l.i !== id))
  }

  return (
    <ResponsiveGridLayout
      className="layout"
      breakpoints={breakpoints}
      cols={cols}
      rowHeight={28}
      isDraggable={editMode}
      isResizable={editMode}
      margin={[12,12]}
      containerPadding={[0,0]}
      layouts={layouts}
      onLayoutChange={onLayoutChange}
      draggableCancel=".todo-input, input, textarea, button"
    >
      {items.map(it => (
        <div key={it.id} data-grid={{ i: it.id, ...it.grid }}>
          {renderWidget(it)}
        </div>
      ))}
    </ResponsiveGridLayout>
  )
}
