import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function BookModal({ book, allTags, onSave, onClose }) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    year: new Date().getFullYear(),
    cover: '',
    description: '',
    tags: [],
    rating: 3,
    status: 'want-to-read',
    visibility: 'public',
    pages: '',
    publisher: '',
    language: 'English',
  })

  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (book) {
      setFormData(book)
    }
  }, [book])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleAddTag = (tag) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }))
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.title.trim()) newErrors.title = t('bookModal.errors.titleRequired')
    if (!formData.author.trim()) newErrors.author = t('bookModal.errors.authorRequired')
    return newErrors
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    onSave(formData)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag(tagInput.trim())
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal book-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {book ? t('bookModal.title.edit') : t('bookModal.title.create')}
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label={t('bookModal.aria.close')}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="book-modal-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title">{t('bookModal.labels.title')} *</label>
              <input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder={t('bookModal.placeholders.title')}
                className={errors.title ? 'input-error' : ''}
              />
              {errors.title && <span className="form-error">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="author">{t('bookModal.labels.author')} *</label>
              <input
                id="author"
                type="text"
                name="author"
                value={formData.author}
                onChange={handleChange}
                placeholder={t('bookModal.placeholders.author')}
                className={errors.author ? 'input-error' : ''}
              />
              {errors.author && <span className="form-error">{errors.author}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="year">{t('bookModal.labels.year')}</label>
              <input
                id="year"
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                placeholder={t('bookModal.placeholders.year')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="pages">{t('bookModal.labels.pages')}</label>
              <input
                id="pages"
                type="number"
                name="pages"
                value={formData.pages}
                onChange={handleChange}
                placeholder={t('bookModal.placeholders.pages')}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="cover">{t('bookModal.labels.cover')}</label>
            <input
              id="cover"
              type="url"
              name="cover"
              value={formData.cover}
              onChange={handleChange}
              placeholder={t('bookModal.placeholders.cover')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="publisher">{t('bookModal.labels.publisher')}</label>
            <input
              id="publisher"
              type="text"
              name="publisher"
              value={formData.publisher}
              onChange={handleChange}
              placeholder={t('bookModal.placeholders.publisher')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">{t('bookModal.labels.description')}</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={t('bookModal.placeholders.description')}
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>{t('bookModal.labels.tags')}</label>
            <div className="tag-input-container">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('bookModal.placeholders.tags')}
              />
              <button
                type="button"
                onClick={() => handleAddTag(tagInput.trim())}
                className="tag-add-btn"
              >
                {t('bookModal.buttons.addTag')}
              </button>
            </div>
            {allTags.length > 0 && (
              <div className="tag-suggestions">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    className={`tag-suggestion ${
                      formData.tags.includes(tag) ? 'selected' : ''
                    }`}
                    onClick={() =>
                      formData.tags.includes(tag)
                        ? handleRemoveTag(tag)
                        : handleAddTag(tag)
                    }
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
            {formData.tags.length > 0 && (
              <div className="selected-tags">
                {formData.tags.map(tag => (
                  <span key={tag} className="selected-tag">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      aria-label={t('bookModal.aria.removeTag', { tag })}
                    >
                      ÁE
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
            <label htmlFor="status">{t('bookModal.labels.status')}</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="want-to-read">{t('bookStatus.wantToRead')}</option>
                <option value="reading">{t('bookStatus.reading')}</option>
                <option value="completed">{t('bookStatus.completed')}</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="rating">{t('bookModal.labels.rating')}</label>
              <div className="rating-selector">
                <select
                  id="rating"
                  name="rating"
                  value={formData.rating}
                  onChange={handleChange}
                >
                  {[0, 1, 2, 3, 4, 5].map(value => (
                    <option key={value} value={value}>
                      {t('bookModal.rating.option', {
                        value,
                        label: t(
                          {
                            0: 'bookModal.rating.notRated',
                            1: 'bookModal.rating.poor',
                            2: 'bookModal.rating.fair',
                            3: 'bookModal.rating.good',
                            4: 'bookModal.rating.veryGood',
                            5: 'bookModal.rating.excellent',
                          }[value],
                        ),
                      })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="language">{t('bookModal.labels.language')}</label>
            <input
              id="language"
              type="text"
              name="language"
              value={formData.language}
              onChange={handleChange}
              placeholder={t('bookModal.placeholders.language')}
            />
          </div>

          <div className="form-group form-group-checkbox">
            <label htmlFor="visibility" className="checkbox-label">
              <input
                id="visibility"
                type="checkbox"
                name="visibility"
                checked={formData.visibility === 'private'}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    visibility: e.target.checked ? 'private' : 'public',
                  }))
                }}
              />
              <span>{t('bookModal.labels.visibility')}</span>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={onClose}>
              {t('buttons.cancel')}
            </button>
            <button type="submit" className="btn">
              {book ? t('bookModal.buttons.save') : t('bookModal.buttons.add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
