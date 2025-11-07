import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getToolCopy, getToolFeatures } from '../lib/tools.js'

export default function ToolPlaceholder({ toolId }) {
  const { t } = useTranslation()

  const { description } = useMemo(() => getToolCopy(t, toolId), [t, toolId])
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
      <div className="tool-detail-content">
        <h2 className="tool-detail-subtitle">{headline}</h2>
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
    </div>
  )
}
