import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Cog, Pencil, X } from 'lucide-react'
import WidgetCanvas from '../components/WidgetCanvas.jsx'
import WidgetPicker from '../components/WidgetPicker.jsx'

const DEFAULT_BACKGROUND = {
  type: 'image',
  value: '/assets/background.png',
  color: '#0f172a',
}

const IMMERSION_STORAGE_KEY = 'immerse-mode-state'

export default function ImmerseMode({ onClose }) {
  const { t } = useTranslation()
  const [editMode, setEditMode] = useState(false)
  const [layout, setLayout] = useState([])
  const [items, setItems] = useState([])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [background, setBackground] = useState(DEFAULT_BACKGROUND)
  const [draftBackground, setDraftBackground] = useState(DEFAULT_BACKGROUND)
  const pickerRef = useRef(null)
  const [pickerHeight, setPickerHeight] = useState(0)
  const storageReadyRef = useRef(false)
  const skipNextSaveRef = useRef(false)

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        if (settingsOpen) {
          setSettingsOpen(false)
          return
        }
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, settingsOpen])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storage = window.sessionStorage
    if (!storage) {
      storageReadyRef.current = true
      return
    }

    try {
      const raw = storage.getItem(IMMERSION_STORAGE_KEY)
      if (!raw) {
        storageReadyRef.current = true
        return
      }
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.layout) && Array.isArray(parsed.items)) {
        skipNextSaveRef.current = true
        setLayout(parsed.layout)
        setItems(parsed.items)
      }
    } catch {
      // Ignore malformed storage data and start fresh
    } finally {
      storageReadyRef.current = true
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!storageReadyRef.current) return
    const storage = window.sessionStorage
    if (!storage) return
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false
      return
    }
    try {
      storage.setItem(
        IMMERSION_STORAGE_KEY,
        JSON.stringify({ layout, items })
      )
    } catch {
      // Persisting is best-effort; ignore quota errors
    }
  }, [layout, items])

  useLayoutEffect(() => {
    if (!editMode) return
    const element = pickerRef.current
    if (!element) return

    function updateHeight() {
      setPickerHeight(element.offsetHeight ?? 0)
    }
    updateHeight()

    if (typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver(updateHeight)
      observer.observe(element)
      return () => observer.disconnect()
    }

    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [editMode])

  const backgroundStyle = useMemo(() => {
    if (background.type === 'image' && background.value) {
      return {
        backgroundImage: `url(${background.value})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: background.color ?? '#0f172a',
      }
    }
    if (background.type === 'color') {
      return {
        backgroundColor: background.color || '#0f172a',
      }
    }
    return {
      backgroundColor: background.color || '#0f172a',
    }
  }, [background])

  function addWidgetFromCatalog(widget) {
    const size = widget?.default ?? { w: 4, h: 3 }
    const cryptoApi = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined
    const idBase =
      cryptoApi && typeof cryptoApi.randomUUID === 'function'
        ? `${widget.type}-${cryptoApi.randomUUID()}`
        : `${widget.type}-${Date.now()}`

    const baseW = typeof size.w === 'number' ? size.w : 4
    const baseH = typeof size.h === 'number' ? size.h : 3
    const minW = typeof size.minW === 'number' ? size.minW : baseW
    const minH = typeof size.minH === 'number' ? size.minH : baseH
    const widthUnits = Math.max(baseW, minW)
    const heightUnits = Math.max(baseH, minH)

    setLayout(prevLayout => {
      const cols = 12
      const perRow = Math.max(1, Math.floor(cols / Math.max(1, widthUnits)))
      const index = prevLayout.length
      const x = (index % perRow) * widthUnits
      const y = Math.floor(index / perRow) * heightUnits
      return [...prevLayout, { i: idBase, x, y, w: widthUnits, h: heightUnits }]
    })

    setItems(prevItems => {
      const cols = 12
      const perRow = Math.max(1, Math.floor(cols / Math.max(1, widthUnits)))
      const index = prevItems.length
      const x = (index % perRow) * widthUnits
      const y = Math.floor(index / perRow) * heightUnits
      const grid = { x, y, w: widthUnits, h: heightUnits }
      const titleKey = widget?.titleKey ?? null
      const fallbackTitle = titleKey ? t(titleKey) : widget?.name ?? widget.type
      return [
        ...prevItems,
        { id: idBase, type: widget.type, titleKey, title: fallbackTitle, grid },
      ]
    })
  }

  function openSettings() {
    setDraftBackground(background)
    setSettingsOpen(true)
  }

  function handleApplySettings(event) {
    event.preventDefault()
    setBackground(draftBackground)
    setSettingsOpen(false)
  }

  function handleChangeDraft(key, value) {
    setDraftBackground(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  function handleChangeType(event) {
    const nextType = event.target.value
    setDraftBackground(prev => ({
      ...prev,
      type: nextType,
    }))
  }

  return (
    <div className={editMode ? 'immerse-mode is-editing' : 'immerse-mode'}>
      <div className="immerse-background" style={backgroundStyle}>
        {background.type === 'video' && background.value && (
          <video
            className="immerse-background-video"
            src={background.value}
            autoPlay
            loop
            muted
            playsInline
          />
        )}
        <div className="immerse-background-overlay" />
      </div>

      <div className="immerse-overlay">
        <div className="immerse-topbar">
          <div className="immerse-topbar-left">
            <button
              type="button"
              className={editMode ? 'immerse-icon-btn is-active' : 'immerse-icon-btn'}
              onClick={() => setEditMode(mode => !mode)}
              aria-label={editMode ? t('buttons.exitEdit') : t('buttons.edit')}
              title={editMode ? t('buttons.exitEdit') : t('buttons.edit')}
            >
              {editMode ? <Check size={18} /> : <Pencil size={18} />}
              <span className="sr-only">
                {editMode ? t('buttons.exitEdit') : t('buttons.edit')}
              </span>
            </button>
            <button
              type="button"
              className="immerse-btn"
              onClick={openSettings}
            >
              <Cog size={18} aria-hidden="true" />
              <span>{t('immerse.settings.open')}</span>
            </button>
          </div>
          <div className="immerse-topbar-right">
            <button
              type="button"
              className="immerse-icon-btn danger"
              onClick={onClose}
              aria-label={t('immerse.close')}
              title={t('immerse.close')}
            >
              <X size={18} />
              <span className="sr-only">{t('immerse.close')}</span>
            </button>
          </div>
        </div>

        <div
          className="immerse-picker"
          ref={pickerRef}
          style={
            editMode
              ? undefined
              : {
                  height: pickerHeight,
                  visibility: pickerHeight > 0 ? 'hidden' : 'visible',
                  pointerEvents: 'none',
                }
          }
          aria-hidden={!editMode}
        >
          {editMode ? <WidgetPicker onAdd={addWidgetFromCatalog} /> : null}
        </div>

        <div className="immerse-grid">
          <WidgetCanvas
            editMode={editMode}
            layout={layout}
            setLayout={setLayout}
            items={items}
            setItems={setItems}
          />
        </div>
      </div>

      {settingsOpen && (
        <div className="immerse-settings-overlay" role="dialog" aria-modal="true">
          <div className="immerse-settings-window">
            <div className="immerse-settings-header">
              <h2>{t('immerse.settings.title')}</h2>
              <button
                type="button"
                className="immerse-btn danger"
                onClick={() => setSettingsOpen(false)}
              >
                {t('immerse.settings.close')}
              </button>
            </div>
            <form className="immerse-settings-form" onSubmit={handleApplySettings}>
              <label className="immerse-field">
                <span>{t('immerse.settings.typeLabel')}</span>
                <select value={draftBackground.type} onChange={handleChangeType}>
                  <option value="image">{t('immerse.settings.type.image')}</option>
                  <option value="video">{t('immerse.settings.type.video')}</option>
                  <option value="color">{t('immerse.settings.type.color')}</option>
                </select>
              </label>

              {draftBackground.type === 'color' ? (
                <label className="immerse-field">
                  <span>{t('immerse.settings.colorLabel')}</span>
                  <input
                    type="color"
                    value={draftBackground.color ?? '#0f172a'}
                    onChange={event => handleChangeDraft('color', event.target.value)}
                  />
                </label>
              ) : (
                <label className="immerse-field">
                  <span>{t('immerse.settings.mediaLabel')}</span>
                  <input
                    type="url"
                    placeholder={t('immerse.settings.mediaPlaceholder')}
                    value={draftBackground.value ?? ''}
                    onChange={event => handleChangeDraft('value', event.target.value)}
                  />
                </label>
              )}

              <div className="immerse-settings-actions">
                <button
                  type="button"
                  className="immerse-btn ghost"
                  onClick={() => setSettingsOpen(false)}
                >
                  {t('buttons.cancel')}
                </button>
                <button type="submit" className="immerse-btn primary">
                  {t('immerse.settings.apply')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
