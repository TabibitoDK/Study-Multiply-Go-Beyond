import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { TOOL_IDS, getToolCopy } from '../lib/tools.js'

const TOOL_ROUTES = {
  calendar: '/calendar',
  immerse: '/immerse',
  flashcards: '/tools/flashcards',
  summary: '/tools/summary',
  pomodoro: '/tools/pomodoro',
}

const SAME_TAB_TOOLS = new Set(['calendar', 'immerse'])

export default function Tools() {
  const { t } = useTranslation()
  const [draft, setDraft] = useState('')

  const tools = useMemo(
    () =>
      TOOL_IDS.map(id => {
        const copy = getToolCopy(t, id)
        return {
          id,
          title: copy.title,
          description: copy.description,
          href: TOOL_ROUTES[id] ?? `/tools/${id}`,
          sameTab: SAME_TAB_TOOLS.has(id),
        }
      }),
    [t],
  )

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
        </div>
      </div>

      <section className="tools-grid">
        {tools.map(tool => {
          if (tool.sameTab) {
            return (
              <Link
                key={tool.id}
                className="tool-card"
                to={tool.href}
              >
                <h2 className="tool-card-title">{tool.title}</h2>
                <p className="tool-card-description">{tool.description}</p>
              </Link>
            )
          }
          return (
            <a
              key={tool.id}
              className="tool-card"
              href={tool.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <h2 className="tool-card-title">{tool.title}</h2>
              <p className="tool-card-description">{tool.description}</p>
            </a>
          )
        })}
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
