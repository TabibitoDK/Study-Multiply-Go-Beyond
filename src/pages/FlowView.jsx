import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import ReactFlow, {
  Background,
  ConnectionMode,
  Controls,
  MarkerType,
  MiniMap,
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

const FlowTaskNode = memo(function FlowTaskNode({ data }) {
  return (
    <div className={`flow-node flow-node--${data.status ?? 'not-started'}`}>
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

  const [defaultArrow, setDefaultArrow] = useState(true)

  const plan = useMemo(
    () => plans.find(candidate => candidate.id === planId) ?? null,
    [plans, planId],
  )

  const taskLookup = useMemo(() => {
    if (!plan) return new Map()
    return new Map((plan.tasks ?? []).map(task => [task.id, task]))
  }, [plan])

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
            data: { hasArrow: defaultArrow },
            markerEnd: defaultArrow ? { ...ARROW_MARKER } : undefined,
          },
          prev,
        ),
      )
    },
    [defaultArrow, setEdges],
  )

  const handleToggleEdgeArrow = useCallback(
    edgeId => {
      setEdges(prev =>
        prev.map(edge => {
          if (edge.id !== edgeId) {
            return edge
          }
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

  const handleDeleteEdge = useCallback(
    edgeId => {
      setEdges(prev => prev.filter(edge => edge.id !== edgeId))
    },
    [setEdges],
  )

  const handleClearEdges = useCallback(() => {
    setEdges([])
    if (storageKey) {
      window.localStorage.removeItem(storageKey)
    }
  }, [setEdges, storageKey])

  const handleGoBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }, [navigate])

  const edgeItems = useMemo(
    () =>
      edges.map(edge => {
        const sourceTitle =
          taskLookup.get(edge.source)?.title ??
          t('flowView.edge.unknownTask', { defaultValue: 'Unknown task' })
        const targetTitle =
          taskLookup.get(edge.target)?.title ??
          t('flowView.edge.unknownTask', { defaultValue: 'Unknown task' })

        return {
          id: edge.id,
          sourceTitle,
          targetTitle,
          hasArrow: edge.data?.hasArrow ?? false,
        }
      }),
    [edges, taskLookup, t],
  )

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
          <p className="flow-view__subtitle">
            {t('flowView.subtitle', {
              defaultValue: 'Arrange tasks and connect relationships visually.',
            })}
          </p>
        </div>
        <div className="flow-view__header-actions">
          <label className="flow-view__toggle">
            <input
              type="checkbox"
              checked={defaultArrow}
              onChange={event => setDefaultArrow(event.target.checked)}
            />
            <span>
              {defaultArrow
                ? t('flowView.toggle.arrowOn', { defaultValue: 'New connections use arrows' })
                : t('flowView.toggle.arrowOff', { defaultValue: 'New connections use simple lines' })}
            </span>
          </label>
          <button
            type="button"
            className="btn ghost"
            disabled={edges.length === 0}
            onClick={handleClearEdges}
          >
            {t('flowView.actions.clearConnections', { defaultValue: 'Clear connections' })}
          </button>
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
            nodeTypes={nodeTypes}
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

        <aside className="flow-view__sidebar">
          <h2 className="flow-view__sidebar-title">
            {t('flowView.sidebar.title', { defaultValue: 'Connections' })}
          </h2>
          {edgeItems.length === 0 ? (
            <p className="flow-view__sidebar-empty">
              {t('flowView.sidebar.empty', {
                defaultValue: 'No connections yet. Drag from one node to another to link tasks.',
              })}
            </p>
          ) : (
            <ul className="flow-view__edge-list">
              {edgeItems.map(item => (
                <li key={item.id} className="flow-view__edge-item">
                  <div className="flow-view__edge-text">
                    <span className="flow-view__edge-source">{item.sourceTitle}</span>
                    <span className="flow-view__edge-arrow">{'\u2192'}</span>
                    <span className="flow-view__edge-target">{item.targetTitle}</span>
                  </div>
                  <div className="flow-view__edge-controls">
                    <label className="flow-view__edge-toggle">
                      <input
                        type="checkbox"
                        checked={item.hasArrow}
                        onChange={() => handleToggleEdgeArrow(item.id)}
                      />
                      <span>
                        {item.hasArrow
                          ? t('flowView.edge.arrowEnabled', { defaultValue: 'Arrow enabled' })
                          : t('flowView.edge.arrowDisabled', { defaultValue: 'Arrow disabled' })}
                      </span>
                    </label>
                    <button
                      type="button"
                      className="flow-view__edge-delete"
                      onClick={() => handleDeleteEdge(item.id)}
                    >
                      {t('flowView.edge.delete', { defaultValue: 'Remove' })}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  )
}
