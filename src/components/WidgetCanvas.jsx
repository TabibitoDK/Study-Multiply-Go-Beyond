import { Responsive, WidthProvider } from 'react-grid-layout'
import { useMemo } from 'react'
import { X } from 'lucide-react'
import ClockWidget from './widgets/ClockWidget.jsx'
import TimerWidget from './widgets/TimerWidget.jsx'
import TodoWidget from './widgets/TodoWidget.jsx'

const ResponsiveGridLayout = WidthProvider(Responsive)

function WidgetShell({ id, title, type, canEdit, onRemove, children }) {
  return (
    <div className="widget" data-id={id} data-type={type}>
      <div className="widget-header">
        <span>{title}</span>
        {canEdit && (
          <button type="button" className="icon-btn" onClick={() => onRemove(id)} title="Delete">
            <X size={16} />
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

  const layoutById = useMemo(() => {
    const map = Object.create(null)
    layout.forEach(entry => {
      map[entry.i] = entry
    })
    return map
  }, [layout])

  const layouts = useMemo(() => {
    const next = {}
    Object.keys(breakpoints).forEach(bp => {
      next[bp] = layout.map(entry => ({ ...entry }))
    })
    return next
  }, [layout])

  function onLayoutChange(currentLayout, allLayouts) {
    const source = allLayouts?.lg ?? currentLayout ?? []
    const lg = source.map(({ i, x, y, w, h }) => ({ i, x, y, w, h }))
    setLayout(lg)

    setItems(prevItems => {
      if (lg.length === 0) return prevItems
      const nextPositions = Object.create(null)
      lg.forEach(entry => {
        nextPositions[entry.i] = entry
      })
      let changed = false
      const updated = prevItems.map(item => {
        const match = nextPositions[item.id]
        if (!match) return item
        const nextGrid = { x: match.x, y: match.y, w: match.w, h: match.h }
        const currentGrid = item.grid ?? {}
        if (
          currentGrid.x === nextGrid.x &&
          currentGrid.y === nextGrid.y &&
          currentGrid.w === nextGrid.w &&
          currentGrid.h === nextGrid.h
        ) {
          return item
        }
        changed = true
        return { ...item, grid: nextGrid }
      })
      return changed ? updated : prevItems
    })
  }

  function renderWidget(widget) {
    const title = widget.title ?? widget.type[0].toUpperCase() + widget.type.slice(1)
    const common = { id: widget.id, title, type: widget.type, canEdit: editMode, onRemove: removeWidget }
    if (widget.type === 'clock') return <WidgetShell {...common}><ClockWidget /></WidgetShell>
    if (widget.type === 'timer') return <WidgetShell {...common}><TimerWidget /></WidgetShell>
    if (widget.type === 'todo') return <WidgetShell {...common}><TodoWidget /></WidgetShell>
    return <div>Unknown widget</div>
  }

  function removeWidget(id) {
    setItems(prev => prev.filter(item => item.id !== id))
    setLayout(prev => prev.filter(entry => entry.i !== id))
  }

  return (
    <ResponsiveGridLayout
      className="layout"
      breakpoints={breakpoints}
      cols={cols}
      rowHeight={28}
      isDraggable={editMode}
      isResizable={editMode}
      margin={[12, 12]}
      containerPadding={[0, 0]}
      layouts={layouts}
      onLayoutChange={onLayoutChange}
      draggableCancel=".todo-input, input, textarea, button"
      compactType="vertical"
      preventCollision={!editMode}
    >
      {items.map(item => {
        const fallbackGrid = item.grid ?? { x: 0, y: 0, w: 4, h: 3 }
        const layoutGrid = layoutById[item.id]
        const grid = layoutGrid ? { x: layoutGrid.x, y: layoutGrid.y, w: layoutGrid.w, h: layoutGrid.h } : fallbackGrid
        return (
          <div key={item.id} data-grid={{ i: item.id, ...grid }}>
            {renderWidget(item)}
          </div>
        )
      })}
    </ResponsiveGridLayout>
  )
}



