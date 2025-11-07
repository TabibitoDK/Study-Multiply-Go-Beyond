import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from '../i18n.js'

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const triggerRef = useRef(null)
  const optionRefs = useRef([])

  const active = i18n.language || i18n.resolvedLanguage || SUPPORTED_LANGUAGES[0]
  let currentLang = active
  if (!SUPPORTED_LANGUAGES.includes(currentLang)) {
    const base = currentLang.split('-')[0]
    currentLang = SUPPORTED_LANGUAGES.includes(base) ? base : SUPPORTED_LANGUAGES[0]
  }

  const labels = useMemo(() => {
    const map = {}
    SUPPORTED_LANGUAGES.forEach(code => {
      map[code] = t(`languageSwitcher.options.${code}`)
    })
    return map
  }, [t])

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleKey(event) {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  useEffect(() => {
    if (!open) return
    const index = Math.max(0, SUPPORTED_LANGUAGES.indexOf(currentLang))
    const node = optionRefs.current[index] ?? optionRefs.current[0]
    node?.focus()
  }, [open, currentLang])

  function toggleMenu() {
    setOpen(prev => !prev)
  }

  function closeMenu() {
    setOpen(false)
  }

  function selectLanguage(lang) {
    if (lang && lang !== i18n.language) {
      i18n.changeLanguage(lang)
    }
    closeMenu()
    triggerRef.current?.focus()
  }

  function handleTriggerKey(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setOpen(prev => !prev)
    }
  }

  function handleOptionKey(event, index) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      const next = optionRefs.current[index + 1] ?? optionRefs.current[0]
      next?.focus()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      const prev = optionRefs.current[index - 1] ?? optionRefs.current[optionRefs.current.length - 1]
      prev?.focus()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      closeMenu()
      triggerRef.current?.focus()
    }
  }

  return (
    <div className={`language-switcher${open ? ' is-open' : ''}`} ref={containerRef}>
      <button
        type="button"
        className="language-trigger"
        onClick={toggleMenu}
        onKeyDown={handleTriggerKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('languageSwitcher.label')}
        ref={triggerRef}
      >
        <Globe size={16} aria-hidden className="language-icon" />
        <span className="language-label">{labels[currentLang] ?? currentLang}</span>
        <ChevronDown size={14} aria-hidden className="language-caret" />
      </button>

      {open && (
        <div className="language-menu" role="listbox" aria-activedescendant={`language-option-${currentLang}`} tabIndex={-1}>
          {SUPPORTED_LANGUAGES.map((lang, index) => (
            <button
              key={lang}
              id={`language-option-${lang}`}
              type="button"
              className={`language-option${currentLang === lang ? ' is-active' : ''}`}
              role="option"
              aria-selected={currentLang === lang}
              onClick={() => selectLanguage(lang)}
              onKeyDown={event => handleOptionKey(event, index)}
              ref={element => {
                optionRefs.current[index] = element
              }}
            >
              {labels[lang] ?? lang}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
