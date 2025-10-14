import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

const TOOL_IDS = ['calendar', 'immerse', 'flashcards', 'summary', 'pomodoro']

const TOOL_DEFAULTS = {
  calendar: {
    title: 'Calendar Planner',
    description: 'Plan study sessions, deadlines, and key reminders in one place.'
  },
  immerse: {
    title: 'Immerse Mode',
    description: 'Switch to a distraction-free layout for deep focus.'
  },
  flashcards: {
    title: 'Flashcards',
    description: 'Quickly drill important terms and definitions.'
  },
  summary: {
    title: 'Summary AI',
    description: 'Generate concise study notes from your materials.'
  },
  pomodoro: {
    title: 'Pomodoro Coach',
    description: 'Structure sessions with focus and break timers.'
  }
}

export default function Tools({ onLaunchTool }) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState('')
  const [activeTool, setActiveTool] = useState(null)

  const tools = useMemo(
    () =>
      TOOL_IDS.map(id => ({
        id,
        title: t(`tools.apps.${id}.title`, { defaultValue: TOOL_DEFAULTS[id]?.title ?? id }),
        description: t(`tools.apps.${id}.description`, {
          defaultValue: TOOL_DEFAULTS[id]?.description ?? ''
        })
      })),
    [t],
  )

  const toolMap = useMemo(
    () => Object.fromEntries(tools.map(tool => [tool.id, tool])),
    [tools]
  )

  function handleLaunch(toolId) {
    if (toolId === 'calendar') {
      setActiveTool(null)
      if (typeof onLaunchTool === 'function') {
        onLaunchTool(toolId)
        return
      }
      console.info('Tool launch placeholder', toolId)
      return
    }

    setActiveTool(toolId)

    if (typeof onLaunchTool === 'function') {
      onLaunchTool(toolId)
      return
    }
    console.info('Tool launch placeholder', toolId)
  }

  function handleSubmit(event) {
    event.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed) return

    // Placeholder for future LLM integration.
    console.info('Tools chat submission pending LLM integration', trimmed)

    setDraft('')
  }

  return (
    <div className="tools-page">
      <div className="tools-header">
        <div>
          <h1 className="tools-title">{t('tools.title')}</h1>
          <p className="tools-subtitle">{t('tools.subtitle')}</p>
        </div>
      </div>

      <section className="tools-grid">
        {tools.map(tool => {
          const isActive = activeTool === tool.id
          const cardClass = isActive ? 'tool-card is-active' : 'tool-card'
          return (
            <button
              key={tool.id}
              type="button"
              className={cardClass}
              onClick={() => handleLaunch(tool.id)}
            >
              <h2 className="tool-card-title">{tool.title}</h2>
              <p className="tool-card-description">{tool.description}</p>
            </button>
          )
        })}
      </section>

      <section className="tools-workspace">
        {!activeTool && (
          <div className="tools-placeholder">
            <h2>
              {t('tools.placeholder.pickTitle', {
                defaultValue: 'Pick a tool to get started'
              })}
            </h2>
            <p>
              {t('tools.placeholder.pickDescription', {
                defaultValue: 'Choose a card from the grid above to open its workspace here.'
              })}
            </p>
          </div>
        )}

        {activeTool && (
          <div className="tools-placeholder">
            <h2>{toolMap[activeTool]?.title ?? t('tools.placeholder.title', { defaultValue: 'Tool in development' })}</h2>
            <p>
              {toolMap[activeTool]?.description ||
                t('tools.placeholder.description', {
                  defaultValue: 'This workspace will unlock soon. Check back after upcoming updates!'
                })}
            </p>
          </div>
        )}
      </section>

      <form className="tools-chat-bar" onSubmit={handleSubmit}>
        <textarea
          className="tools-chat-input"
          placeholder={t('tools.chat.placeholder')}
          value={draft}
          onChange={event => setDraft(event.target.value)}
          rows={2}
          aria-label={t('tools.chat.placeholder')}
        />
        <button
          type="submit"
          className="tools-chat-send"
          disabled={!draft.trim()}
        >
          {t('tools.chat.send')}
        </button>
      </form>
    </div>
  )
}
