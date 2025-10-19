import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import HttpBackend from 'i18next-http-backend'

export const SUPPORTED_LANGUAGES = ['en', 'ja']
export const DEFAULT_NAMESPACE = 'common'
const FALLBACK_LANGUAGE = 'en'
const LANGUAGE_STORAGE_KEY = 'smgb.language'

const detectorOptions = {
  order: ['localStorage', 'navigator'],
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

i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng
  }
})

export default i18n
