import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { TOOL_IDS, getToolCopy } from '../lib/tools.js'
import CatPeekAnimation from '../components/CatPeekAnimation.jsx'

const TOOL_ROUTES = {
  calendar: '/calendar',
  immerse: '/immerse',
  flashcards: '/tools/flashcards',
  chat: '/tools/chat',
  stream: '/tools/stream',
  aichat: '/tools/aichat',
}

const SAME_TAB_TOOLS = new Set(['calendar', 'immerse', 'flashcards', 'chat', 'stream', 'aichat'])

export default function Tools() {
  const { t } = useTranslation()

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

  return (
    <div className="tools-page">
      <div className="tools-header">
        <div>
          <h1 className="tools-title">{t('tools.title')}</h1>
        </div>
      </div>

      <section className="tools-grid">
        {tools.map(tool => (
          <Link
            key={tool.id}
            className="tool-card"
            to={tool.href}
          >
            <h2 className="tool-card-title">{tool.title}</h2>
            <p className="tool-card-description">{tool.description}</p>
          </Link>
        ))}
      </section>

      <div className="cat-peek-spot">
        <CatPeekAnimation size={152} />
      </div>
    </div>
  )
}
