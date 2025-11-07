import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

export function useI18nFormats() {
  const { i18n } = useTranslation()
  const locale = i18n.language || i18n.resolvedLanguage || 'en'

  const formatNumber = useCallback(
    (value, options) => {
      const numeric = typeof value === 'number' ? value : Number(value)
      if (Number.isNaN(numeric)) {
        return value ?? ''
      }
      return new Intl.NumberFormat(locale, options).format(numeric)
    },
    [locale],
  )

  const formatDate = useCallback(
    (value, options) => {
      if (!value) return ''
      const date = value instanceof Date ? value : new Date(value)
      if (Number.isNaN(date.getTime())) {
        return ''
      }
      const formatter = new Intl.DateTimeFormat(locale, options)
      return formatter.format(date)
    },
    [locale],
  )

  const formatDateTime = useCallback(
    (value, options) => {
      const defaults = { dateStyle: 'medium', timeStyle: 'short' }
      return formatDate(value, { ...defaults, ...options })
    },
    [formatDate],
  )

  return { locale, formatNumber, formatDate, formatDateTime }
}
