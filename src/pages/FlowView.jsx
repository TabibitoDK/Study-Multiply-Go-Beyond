import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import ReactFlow, {
  Background,
  BaseEdge,
  ConnectionMode,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  addEdge,
  getSmoothStepPath,
  useEdgesState,
  useNodesState,
  useReactFlow,
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
  type: 'floating',
  style: EDGE_STYLE,
}
const DEFAULT_NODE_HEIGHT = 160

const FlowTaskNode = memo(function FlowTaskNode({ data }) {
  return (
    <div className={`flow-node flow-node--${data.status ?? 'not-started'}`}>
      <Handle
        type="target"
        position={Position.Left}
        className="flow-node__handle flow-node__handle--left"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="flow-node__handle flow-node__handle--right"
      />
      <span className="flow-node__status">{data.statusLabel}</span>
      <h3 className="flow-node__title">{data.title}</h3>
      {data.description ? <p className="flow-node__description">{data.description}</p> : null}
    </div>
  )
})

function getNodeCenter(node) {
  const position = node.positionAbsolute ?? node.position ?? { x: 0, y: 0 }
  const width = node.measured?.width ?? node.width ?? DEFAULT_NODE_WIDTH
  const height = node.measured?.height ?? node.height ?? DEFAULT_NODE_HEIGHT
  return {
    x: position.x + width / 2,
    y: position.y + height / 2,
    width,
    height,
  }
}

function getFloatingEdgeParams(sourceNode, targetNode) {
  const sourceCenter = getNodeCenter(sourceNode)
  const targetCenter = getNodeCenter(targetNode)
  const horizontal = Math.abs(sourceCenter.x - targetCenter.x) >= Math.abs(sourceCenter.y - targetCenter.y)

  const sourcePosition = horizontal
    ? sourceCenter.x < targetCenter.x
      ? Position.Right
      : Position.Left
    : sourceCenter.y < targetCenter.y
      ? Position.Bottom
      : Position.Top

  const targetPosition = horizontal
    ? sourceCenter.x < targetCenter.x
      ? Position.Left
      : Position.Right
    : sourceCenter.y < targetCenter.y
      ? Position.Top
      : Position.Bottom

  const sourceX =
    sourceCenter.x +
    (sourcePosition === Position.Right
      ? sourceCenter.width / 2
      : sourcePosition === Position.Left
        ? -sourceCenter.width / 2
        : 0)
  const sourceY =
    sourceCenter.y +
    (sourcePosition === Position.Bottom
      ? sourceCenter.height / 2
      : sourcePosition === Position.Top
        ? -sourceCenter.height / 2
        : 0)

  const targetX =
    targetCenter.x +
    (targetPosition === Position.Right
      ? targetCenter.width / 2
      : targetPosition === Position.Left
        ? -targetCenter.width / 2
        : 0)
  const targetY =
    targetCenter.y +
    (targetPosition === Position.Bottom
      ? targetCenter.height / 2
      : targetPosition === Position.Top
        ? -targetCenter.height / 2
        : 0)

  return {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  }
}

function FloatingEdge({ id, source, target, markerEnd, style, selected }) {
  const { getNode, getEdges } = useReactFlow()
  const sourceNode = getNode(source)
  const targetNode = getNode(target)

  if (!sourceNode || !targetNode) {
    return null
  }

  let { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } = getFloatingEdgeParams(
    sourceNode,
    targetNode,
  )

  const siblingKey = [source, target].sort().join('__')
  const siblings = getEdges()
    .filter(edge => {
      const edgeKey = [edge.source, edge.target].sort().join('__')
      return edgeKey === siblingKey
    })
    .sort((a, b) => (a.id > b.id ? 1 : -1))

  if (siblings.length > 1) {
    const index = siblings.findIndex(edge => edge.id === id)
    if (index !== -1) {
      const offsetAmount = 16
      const offset = (index - (siblings.length - 1) / 2) * offsetAmount
      const isHorizontal = sourcePosition === Position.Left || sourcePosition === Position.Right
      if (isHorizontal) {
        sourceY += offset
        targetY += offset
      } else {
        sourceX += offset
        targetX += offset
      }
    }
  }

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{ ...EDGE_STYLE, ...(style ?? {}) }}
      selected={selected}
    />
  )
}

const nodeTypes = {
  task: FlowTaskNode,
}
const edgeTypes = {
  floating: FloatingEdge,
}

function sanitizeEdgesForStorage(edges) {
  return edges.map(({ markerEnd: _markerEnd, ...rest }) => rest)
}

function hydrateEdgesFromStorage(edges) {
  return edges.map(edge => {
    const hasArrow = edge?.data?.hasArrow ?? false
    return {
      ...edge,
      type: 'floating',
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
            type: 'floating',
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
            edgeTypes={edgeTypes}
            defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
            connectionLineStyle={EDGE_STYLE}
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
