import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import ReactFlow, {
  Background,
  ConnectionMode,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  addEdge,
  useEdgesState,
  useNodesState,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useTaskManager } from '../context/TaskManagerContext.jsx'

const STATUS_LABEL_KEYS = {
  'not-started': 'home.dashboard.longTerm.status.notStarted',
  'in-progress': 'home.dashboard.longTerm.status.inProgress',
  cancelled: 'home.dashboard.longTerm.status.cancelled',
  completed: 'home.dashboard.longTerm.status.completed',
}

const STATUS_DEFAULT_LABELS = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  cancelled: 'Cancelled',
  completed: 'Completed',
}

const ARROW_MARKER = {
  type: MarkerType.ArrowClosed,
  width: 18,
  height: 18,
  color: '#111111',
}

const DEFAULT_NODE_WIDTH = 280
const GRID_GAP_X = 320
const GRID_GAP_Y = 200
const EDGE_STYLE = {
  strokeWidth: 3,
  stroke: '#111111',
  strokeLinecap: 'round',
}
const DEFAULT_EDGE_OPTIONS = {
  type: 'smoothstep',
  style: EDGE_STYLE,
}

const NODE_HANDLES = [
  { id: 'top-target', type: 'target', position: Position.Top, direction: 'top', offsetKey: 'left', offsetValue: '30%' },
  { id: 'top-source', type: 'source', position: Position.Top, direction: 'top', offsetKey: 'left', offsetValue: '70%' },
  { id: 'bottom-target', type: 'target', position: Position.Bottom, direction: 'bottom', offsetKey: 'left', offsetValue: '30%' },
  { id: 'bottom-source', type: 'source', position: Position.Bottom, direction: 'bottom', offsetKey: 'left', offsetValue: '70%' },
  { id: 'left-target', type: 'target', position: Position.Left, direction: 'left', offsetKey: 'top', offsetValue: '30%' },
  { id: 'left-source', type: 'source', position: Position.Left, direction: 'left', offsetKey: 'top', offsetValue: '70%' },
  { id: 'right-target', type: 'target', position: Position.Right, direction: 'right', offsetKey: 'top', offsetValue: '30%' },
  { id: 'right-source', type: 'source', position: Position.Right, direction: 'right', offsetKey: 'top', offsetValue: '70%' },
]

const FlowTaskNode = memo(function FlowTaskNode({ data }) {
  return (
    <div className={`flow-node flow-node--${data.status ?? 'not-started'}`}>
      {NODE_HANDLES.map(handle => (
        <Handle
          key={handle.id}
          id={handle.id}
          type={handle.type}
          position={handle.position}
          className={`flow-node__handle flow-node__handle--${handle.direction}`}
          style={
            handle.offsetKey
              ? { [handle.offsetKey]: handle.offsetValue }
              : undefined
          }
        />
      ))}
      <span className="flow-node__status">{data.statusLabel}</span>
      <h3 className="flow-node__title">{data.title}</h3>
      {data.description ? <p className="flow-node__description">{data.description}</p> : null}
    </div>
  )
})

const nodeTypes = {
  task: FlowTaskNode,
}

function sanitizeEdgesForStorage(edges) {
  return edges.map(({ markerEnd: _markerEnd, ...rest }) => rest)
}

function hydrateEdgesFromStorage(edges) {
  return edges.map(edge => {
    const hasArrow = edge?.data?.hasArrow ?? false
    return {
      ...edge,
      style: { ...EDGE_STYLE, ...(edge.style ?? {}) },
      markerEnd: hasArrow ? { ...ARROW_MARKER } : undefined,
    }
  })
}

function buildInitialNodes(plan, t) {
  if (!plan) return []
  const tasks = Array.isArray(plan.tasks) ? plan.tasks : []
  if (tasks.length === 0) return []

  return tasks.map((task, index) => {
    const status = task.status ?? 'not-started'
    const key = STATUS_LABEL_KEYS[status]
    const statusLabel = key
      ? t(key, { defaultValue: STATUS_DEFAULT_LABELS[status] })
      : STATUS_DEFAULT_LABELS[status] ?? t('flowView.status.unknown', { defaultValue: 'Unknown' })

    const column = index % 3
    const row = Math.floor(index / 3)

    return {
      id: task.id,
      type: 'task',
      position: {
        x: column * GRID_GAP_X,
        y: row * GRID_GAP_Y,
      },
      style: {
        width: DEFAULT_NODE_WIDTH,
        minWidth: DEFAULT_NODE_WIDTH,
      },
      data: {
        title: task.title ?? t('flowView.task.untitled', { defaultValue: 'Untitled task' }),
        description: task.description ?? '',
        status,
        statusLabel,
      },
    }
  })
}

export default function FlowView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { planId } = useParams()
  const { plans } = useTaskManager()
  const [edgeContextMenu, setEdgeContextMenu] = useState(null)

  const plan = useMemo(
    () => plans.find(candidate => candidate.id === planId) ?? null,
    [plans, planId],
  )

  const initialNodes = useMemo(() => buildInitialNodes(plan, t), [plan, t])
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)

  useEffect(() => {
    setNodes(initialNodes)
  }, [initialNodes, setNodes])

  const storageKey = plan ? `flow-view:${plan.id}:edges` : null
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    if (!storageKey) {
      setEdges([])
      return
    }

    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) {
        setEdges([])
        return
      }
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) {
        setEdges([])
        return
      }
      setEdges(hydrateEdgesFromStorage(parsed))
    } catch (error) {
      console.error('Failed to load flow connections from storage', error)
      setEdges([])
    }
  }, [storageKey, setEdges])

  useEffect(() => {
    if (!storageKey) return
    try {
      const serializable = sanitizeEdgesForStorage(edges)
      window.localStorage.setItem(storageKey, JSON.stringify(serializable))
    } catch (error) {
      console.error('Failed to persist flow connections', error)
    }
  }, [edges, storageKey])

  const handleConnect = useCallback(
    connection => {
      if (!connection.source || !connection.target) return

      setEdges(prev =>
        addEdge(
          {
            ...connection,
            id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
            type: 'smoothstep',
            data: { hasArrow: true },
            markerEnd: { ...ARROW_MARKER },
            style: { ...EDGE_STYLE },
          },
          prev,
        ),
      )
    },
    [setEdges],
  )

  const handleDeleteEdge = useCallback(
    edgeId => {
      setEdges(prev => prev.filter(edge => edge.id !== edgeId))
    },
    [setEdges],
  )

  const handleEdgeContextMenu = useCallback((event, edge) => {
    event.preventDefault()
    setEdgeContextMenu({
      edgeId: edge.id,
      x: event.clientX,
      y: event.clientY,
    })
  }, [])

  const handleDismissContextMenu = useCallback(() => {
    setEdgeContextMenu(null)
  }, [])

  const handleDeleteSelectedEdge = useCallback(() => {
    if (!edgeContextMenu?.edgeId) return
    handleDeleteEdge(edgeContextMenu.edgeId)
    setEdgeContextMenu(null)
  }, [edgeContextMenu, handleDeleteEdge])

  const handleToggleEdgeArrow = useCallback(
    edgeId => {
      setEdges(prev =>
        prev.map(edge => {
          if (edge.id !== edgeId) return edge
          const hasArrow = !(edge.data?.hasArrow ?? false)
          return {
            ...edge,
            data: {
              ...edge.data,
              hasArrow,
            },
            markerEnd: hasArrow ? { ...ARROW_MARKER } : undefined,
          }
        }),
      )
    },
    [setEdges],
  )

  const handleToggleSelectedEdgeArrow = useCallback(() => {
    if (!edgeContextMenu?.edgeId) return
    handleToggleEdgeArrow(edgeContextMenu.edgeId)
    setEdgeContextMenu(null)
  }, [edgeContextMenu, handleToggleEdgeArrow])

  useEffect(() => {
    if (!edgeContextMenu) return

    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        setEdgeContextMenu(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [edgeContextMenu])

  useEffect(() => {
    if (!edgeContextMenu) return

    const handlePointerDown = () => setEdgeContextMenu(null)

    window.addEventListener('pointerdown', handlePointerDown)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [edgeContextMenu])

  const handleGoBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }, [navigate])

  const contextEdge = useMemo(() => {
    if (!edgeContextMenu) return null
    return edges.find(edge => edge.id === edgeContextMenu.edgeId) ?? null
  }, [edgeContextMenu, edges])

  if (!plan) {
    return (
      <div className="flow-view flow-view--empty">
        <div className="flow-view__empty-card">
          <h1 className="flow-view__empty-title">
            {t('flowView.missing.title', { defaultValue: 'Plan not found' })}
          </h1>
          <p className="flow-view__empty-description">
            {t('flowView.missing.description', {
              defaultValue: 'We could not find the plan for this flow view.',
            })}
          </p>
          <button type="button" className="btn" onClick={handleGoBack}>
            {t('flowView.actions.back', { defaultValue: 'Go back' })}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flow-view">
      <header className="flow-view__header">
        <button type="button" className="btn ghost" onClick={handleGoBack}>
          {t('flowView.actions.back', { defaultValue: 'Back' })}
        </button>
        <div className="flow-view__title-group">
          <h1 className="flow-view__title">{plan.title}</h1>
        </div>
      </header>

      <div className="flow-view__layout">
        <section className="flow-view__canvas" aria-label={t('flowView.canvasAria', { defaultValue: 'Task flow canvas' })}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            onPaneClick={handleDismissContextMenu}
            onEdgeClick={handleDismissContextMenu}
            onEdgeContextMenu={handleEdgeContextMenu}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
            fitView
            connectionMode={ConnectionMode.Loose}
            snapToGrid
            snapGrid={[16, 16]}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={24} color="#f0f0f0" />
            <MiniMap pannable zoomable />
            <Controls />
          </ReactFlow>
        </section>
      </div>
      {edgeContextMenu && contextEdge ? (
        <div
          className="flow-view__context-menu"
          style={{ top: edgeContextMenu.y, left: edgeContextMenu.x }}
          onClick={event => event.stopPropagation()}
          onPointerDown={event => event.stopPropagation()}
          onContextMenu={event => event.preventDefault()}
        >
          <button
            type="button"
            className="flow-view__context-menu-item"
            onClick={event => {
              event.stopPropagation()
              handleToggleSelectedEdgeArrow()
            }}
          >
            {contextEdge.data?.hasArrow
              ? t('flowView.contextMenu.useSimpleLine', { defaultValue: 'Use simple line' })
              : t('flowView.contextMenu.useArrow', { defaultValue: 'Use arrow line' })}
          </button>
          <button
            type="button"
            className="flow-view__context-menu-item"
            onClick={event => {
              event.stopPropagation()
              handleDeleteSelectedEdge()
            }}
          >
            {t('flowView.contextMenu.deleteConnection', { defaultValue: 'Delete connection' })}
          </button>
        </div>
      ) : null}
    </div>
  )
}
