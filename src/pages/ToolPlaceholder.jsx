import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getToolCopy, getToolFeatures } from '../lib/tools.js'

export default function ToolPlaceholder({ toolId }) {
  const { t } = useTranslation()

  const { title, description } = useMemo(() => getToolCopy(t, toolId), [t, toolId])
  const features = useMemo(() => getToolFeatures(toolId), [toolId])

  const headline = t(`tools.detail.${toolId}.headline`, {
    defaultValue: t('tools.detail.defaultHeadline', { defaultValue: 'This workspace is on the way.' })
  })
  const body = t(`tools.detail.${toolId}.body`, {
    defaultValue:
      description ||
      t('tools.detail.defaultBody', {
        defaultValue: 'We are preparing a dedicated experience. Here is what we are planning:'
      })
  })

  return (
    <div className="tool-detail-page">
      <header className="tool-detail-header">
        <div>
          <h1 className="tool-detail-title">{title}</h1>
          <p className="tool-detail-subtitle">{headline}</p>
        </div>
        <Link to="/tools" className="tool-detail-back">
          {t('tools.detail.back', { defaultValue: 'Back to tools' })}
        </Link>
      </header>

      <section className="tool-detail-card">
        <p className="tool-detail-body">{body}</p>
        {features.length > 0 && (
          <ul className="tool-detail-list">
            {features.map(feature => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
