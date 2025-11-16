import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PenLine } from 'lucide-react'
import dayjs from 'dayjs'
import { useI18nFormats } from '../../lib/i18n-format.js'
import bookService from '../../services/bookService.js'

export default function PostModal({ open, onClose, onSubmit }) {
  const [text, setText] = useState('')
  const [selectedBookId, setSelectedBookId] = useState('')
  const [bookOptions, setBookOptions] = useState([])
  const [booksLoading, setBooksLoading] = useState(false)
  const [booksError, setBooksError] = useState(null)
  const [duration, setDuration] = useState('')
  const [subject, setSubject] = useState('')
  const { t } = useTranslation()
  const { formatNumber } = useI18nFormats()

  useEffect(() => {
    if (!open || bookOptions.length) {
      return undefined
    }

    let cancelled = false

    const loadBooks = async () => {
      setBooksLoading(true)
      setBooksError(null)
      try {
        const books = await bookService.getAllBooks()
        if (!cancelled) {
          setBookOptions(books)
        }
      } catch (error) {
        console.error('Failed to load books for post modal:', error)
        if (!cancelled) {
          setBooksError(
            t('social.postModal.errors.books', {
              defaultValue: 'Failed to load library resources. You can still post without linking a book.',
            }),
          )
        }
      } finally {
        if (!cancelled) {
          setBooksLoading(false)
        }
      }
    }

    loadBooks()

    return () => {
      cancelled = true
    }
  }, [open, bookOptions.length, t])

  const selectedBook = useMemo(
    () => bookOptions.find(option => option.id === selectedBookId) || null,
    [bookOptions, selectedBookId],
  )

  const charactersUsed = text.trim().length
  const canSubmit = useMemo(() => {
    return charactersUsed > 0 || selectedBookId || duration.trim() || subject.trim()
  }, [charactersUsed, selectedBookId, duration, subject])

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    const bookTitle = selectedBook?.title?.trim() || ''
    const post = {
      id: crypto.randomUUID(),
      authorName: 'Nickname',
      authorHandle: 'username',
      text: text.trim(),
      book: bookTitle || null,
      bookId: selectedBookId || null,
      bookTitle,
      bookAuthor: selectedBook?.author || '',
      bookCover: selectedBook?.cover || '',
      duration: duration.trim() || null,
      subject: subject.trim() || null,
      images: [],
      createdAt: dayjs().toISOString(),
    }
    onSubmit(post)
    setText('')
    setSelectedBookId('')
    setDuration('')
    setSubject('')
    onClose()
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal post-modal" role="dialog" aria-modal="true" aria-labelledby="post-modal-title" onClick={event => event.stopPropagation()}>
        <div className="post-modal__header">
          <div className="post-modal__badge" aria-hidden="true">
            <PenLine size={20} />
          </div>
          <div className="post-modal__heading">
            <h2 className="modal-title" id="post-modal-title">
              {t('social.postModal.title', { defaultValue: 'New Study Post' })}
            </h2>
            <p className="post-modal__subtitle">
              {t('social.postModal.subtitle', {
                defaultValue: 'Capture today’s progress, wins, or questions for your study circle.',
              })}
            </p>
          </div>
          <button
            type="button"
            className="post-modal__close"
            onClick={onClose}
            aria-label={t('social.postModal.close', { defaultValue: 'Close dialog' })}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="post-modal__form">
          <label className="post-modal__field">
            <span>{t('social.postModal.fields.text', { defaultValue: 'What did you work on?' })}</span>
            <textarea
              className="input textarea"
              placeholder={t('social.postModal.placeholders.text', {
                defaultValue: 'Share study notes, questions, or insights from today…',
              })}
              rows={5}
              value={text}
              onChange={event => setText(event.target.value)}
            />
            <span className="post-modal__helper">
              {t('social.postModal.characters', {
                defaultValue: '{{formattedCount}} characters',
                count: charactersUsed,
                formattedCount: formatNumber(charactersUsed),
              })}
            </span>
          </label>

          <div className="post-modal__grid">
            <label className="post-modal__field">
              <span>{t('social.postModal.fields.book', { defaultValue: '教材 / リソース' })}</span>
              <select
                className="input"
                value={selectedBookId}
                onChange={event => setSelectedBookId(event.target.value)}
                disabled={booksLoading || (!!booksError && !bookOptions.length)}
              >
                <option value="">
                  {t('social.postModal.bookOptions.none', { defaultValue: 'なし（本をリンクしない）' })}
                </option>
                {bookOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.title || option.name || t('social.postModal.bookOptions.untitled', { defaultValue: 'Untitled book' })}
                  </option>
                ))}
              </select>
              {booksError && (
                <span className="post-modal__helper post-modal__helper--error">{booksError}</span>
              )}
            </label>

            <label className="post-modal__field">
              <span>{t('social.postModal.fields.duration', { defaultValue: 'Duration' })}</span>
              <input
                className="input"
                placeholder={t('social.postModal.placeholders.duration', {
                  defaultValue: 'e.g. 45m, 2h',
                })}
                value={duration}
                onChange={event => setDuration(event.target.value)}
              />
            </label>

            <label className="post-modal__field">
              <span>{t('social.postModal.fields.subject', { defaultValue: 'Subject / Tag' })}</span>
              <input
                className="input"
                placeholder={t('social.postModal.placeholders.subject', {
                  defaultValue: 'e.g. Linear algebra, grade 2 Kanji',
                })}
                value={subject}
                onChange={event => setSubject(event.target.value)}
              />
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={onClose}>
              {t('buttons.cancel')}
            </button>
            <button type="submit" className="btn cat-primary" disabled={!canSubmit}>
              {t('social.postModal.submit', { defaultValue: 'Post' })}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
