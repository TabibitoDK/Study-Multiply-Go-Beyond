import { Responsive, WidthProvider } from 'react-grid-layout'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import ClockWidget from './widgets/ClockWidget.jsx'
import TimerWidget from './widgets/TimerWidget.jsx'
import TodoWidget from './widgets/TodoWidget.jsx'

const ResponsiveGridLayout = WidthProvider(Responsive)

const TYPE_PRESETS = {
  clock: { minW: 3, minH: 3, defaultW: 3, defaultH: 3 },
  timer: { minW: 5, minH: 4, defaultW: 5, defaultH: 4 },
  todo: { minW: 4, minH: 4, defaultW: 4, defaultH: 4 },
}

const TYPE_LABEL_KEYS = {
  clock: 'widgets.clock.name',
  timer: 'widgets.timer.name',
  todo: 'widgets.todo.name',
}

function WidgetShell({ id, title, type, canEdit, onRemove, deleteLabel, children }) {
  return (
    <div className="widget" data-id={id} data-type={type}>
      <div className="widget-header">
        <span>{title}</span>
        {canEdit && (
          <button type="button" className="icon-btn" onClick={() => onRemove(id)} title={deleteLabel} aria-label={deleteLabel}>
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
  const { t } = useTranslation()
  const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }
  const cols =       { lg: 12,   md: 10,  sm: 8,   xs: 6,   xxs: 4 }

  useEffect(() => {
    if (layout.length === 0 && items.length === 0) return

    const itemType = new Map(items.map(item => [item.id, item.type]))

    let layoutChanged = false
    const adjustedLayout = layout.map(entry => {
      const preset = TYPE_PRESETS[itemType.get(entry.i) ?? '']
      if (!preset) return entry
      const w = Math.max(entry.w ?? preset.minW ?? 4, preset.minW ?? entry.w ?? 4)
      const h = Math.max(entry.h ?? preset.minH ?? 4, preset.minH ?? entry.h ?? 4)
      if (w !== entry.w || h !== entry.h) {
        layoutChanged = true
        return { ...entry, w, h }
      }
      return entry
    })
    if (layoutChanged) setLayout(adjustedLayout)

    let itemsChanged = false
    const adjustedItems = items.map(item => {
      const preset = TYPE_PRESETS[item.type]
      if (!preset) return item
      const base = item.grid ?? { x: 0, y: 0, w: preset.defaultW ?? preset.minW ?? 4, h: preset.defaultH ?? preset.minH ?? 4 }
      const w = Math.max(base.w ?? preset.minW ?? 4, preset.minW ?? base.w ?? 4)
      const h = Math.max(base.h ?? preset.minH ?? 4, preset.minH ?? base.h ?? 4)
      if (w !== base.w || h !== base.h) {
        itemsChanged = true
        return { ...item, grid: { ...base, w, h } }
      }
      if (!item.grid) {
        itemsChanged = true
        return { ...item, grid: base }
      }
      return item
    })
    if (itemsChanged) setItems(adjustedItems)
  }, [items, layout, setItems, setLayout])

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
    const labelKey = widget.titleKey || TYPE_LABEL_KEYS[widget.type]
    const fallback = widget.title || widget.type
    const title = labelKey ? t(labelKey) : fallback
    const common = {
      id: widget.id,
      title,
      type: widget.type,
      canEdit: editMode,
      onRemove: removeWidget,
      deleteLabel: t('widgets.delete'),
    }
    if (widget.type === 'clock') return <WidgetShell {...common}><ClockWidget /></WidgetShell>
    if (widget.type === 'timer') return <WidgetShell {...common}><TimerWidget /></WidgetShell>
    if (widget.type === 'todo') return <WidgetShell {...common}><TodoWidget /></WidgetShell>
    return <div>{t('widgets.unknown')}</div>
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
      rowHeight={48}
      isDraggable={editMode}
      isResizable={editMode}
      margin={[12, 12]}
      containerPadding={[0, 0]}
      layouts={layouts}
      onLayoutChange={onLayoutChange}
      draggableCancel=".todo-input, input, textarea, button"
      compactType={null}
      preventCollision={!editMode}
    >
      {items.map(item => {
        const preset = TYPE_PRESETS[item.type] ?? {}
        const fallbackGrid = item.grid ?? {
          x: 0,
          y: 0,
          w: preset.defaultW ?? preset.minW ?? 4,
          h: preset.defaultH ?? preset.minH ?? 4,
        }
        const layoutGrid = layoutById[item.id]
        const grid = layoutGrid ? { x: layoutGrid.x, y: layoutGrid.y, w: layoutGrid.w, h: layoutGrid.h } : fallbackGrid
        const dataGrid = {
          i: item.id,
          ...grid,
          minW: preset.minW,
          minH: preset.minH,
        }
        return (
          <div key={item.id} data-grid={dataGrid}>
            {renderWidget(item)}
          </div>
        )
      })}
    </ResponsiveGridLayout>
  )
}
