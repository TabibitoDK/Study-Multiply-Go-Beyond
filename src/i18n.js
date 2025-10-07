import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import HttpBackend from 'i18next-http-backend'

export const SUPPORTED_LANGUAGES = ['en', 'ja']
export const DEFAULT_NAMESPACE = 'common'
const FALLBACK_LANGUAGE = 'en'
const LANGUAGE_STORAGE_KEY = 'smgb.language'

function getPathLocale() {
  if (typeof window === 'undefined') return null
  const segments = window.location.pathname.split('/').filter(Boolean)
  const candidate = segments[0]
  return SUPPORTED_LANGUAGES.includes(candidate) ? candidate : null
}

function ensureLocaleInPath(language) {
  if (typeof window === 'undefined') return
  const target = SUPPORTED_LANGUAGES.includes(language) ? language : FALLBACK_LANGUAGE
  const segments = window.location.pathname.split('/').filter(Boolean)
  const hasLocale = segments.length > 0 && SUPPORTED_LANGUAGES.includes(segments[0])
  const rest = hasLocale ? segments.slice(1) : segments
  const nextSegments = [target, ...rest]
  const nextPathValue = '/' + nextSegments.join('/')
  const sanitizedNextPath = nextPathValue.replace(/\/+/, '/').replace(/\/+/g, '/').replace(/\/$/, '/')
  const currentSanitized = window.location.pathname.replace(/\/+/, '/').replace(/\/+/g, '/').replace(/\/$/, '/')
  if (currentSanitized !== sanitizedNextPath) {
    const search = window.location.search || ''
    const hash = window.location.hash || ''
    const nextUrl = sanitizedNextPath + search + hash
    window.history.replaceState({}, '', nextUrl)
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = target
  }
}

const detectedPathLocale = getPathLocale()

const detectorOptions = {
  order: ['path', 'localStorage', 'navigator'],
  lookupFromPathIndex: 0,
  lookupLocalStorage: LANGUAGE_STORAGE_KEY,
  caches: ['localStorage'],
  excludeCacheFor: ['cimode'],
}

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: FALLBACK_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,
    ns: [DEFAULT_NAMESPACE],
    defaultNS: DEFAULT_NAMESPACE,
    load: 'languageOnly',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: detectorOptions,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: true,
    },
    returnNull: false,
  })
  .then(() => {
    const initial = detectedPathLocale ?? i18n.resolvedLanguage ?? FALLBACK_LANGUAGE
    ensureLocaleInPath(initial)
  })

i18n.on('languageChanged', ensureLocaleInPath)

export default i18n
