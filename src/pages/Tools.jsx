import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

const TOOL_IDS = ['immerse', 'flashcards', 'summary', 'pomodoro']

export default function Tools({ onLaunchTool }) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState('')

  const tools = useMemo(
    () =>
      TOOL_IDS.map(id => ({
        id,
        title: t(`tools.apps.${id}.title`),
        description: t(`tools.apps.${id}.description`),
      })),
    [t],
  )

  function handleLaunch(toolId) {
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
        {tools.map(tool => (
          <button
            key={tool.id}
            type="button"
            className="tool-card"
            onClick={() => handleLaunch(tool.id)}
          >
            <h2 className="tool-card-title">{tool.title}</h2>
            <p className="tool-card-description">{tool.description}</p>
          </button>
        ))}
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
