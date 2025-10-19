import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function BookModal({ book, allTags, onSave, onClose }) {
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
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.author.trim()) newErrors.author = 'Author is required'
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
            {book ? 'Edit Book' : 'Add New Book'}
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="book-modal-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Book title"
                className={errors.title ? 'input-error' : ''}
              />
              {errors.title && <span className="form-error">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="author">Author *</label>
              <input
                id="author"
                type="text"
                name="author"
                value={formData.author}
                onChange={handleChange}
                placeholder="Author name"
                className={errors.author ? 'input-error' : ''}
              />
              {errors.author && <span className="form-error">{errors.author}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="year">Year</label>
              <input
                id="year"
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                placeholder="2024"
              />
            </div>

            <div className="form-group">
              <label htmlFor="pages">Pages</label>
              <input
                id="pages"
                type="number"
                name="pages"
                value={formData.pages}
                onChange={handleChange}
                placeholder="Number of pages"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="cover">Cover Image URL</label>
            <input
              id="cover"
              type="url"
              name="cover"
              value={formData.cover}
              onChange={handleChange}
              placeholder="https://example.com/cover.jpg"
            />
          </div>

          <div className="form-group">
            <label htmlFor="publisher">Publisher</label>
            <input
              id="publisher"
              type="text"
              name="publisher"
              value={formData.publisher}
              onChange={handleChange}
              placeholder="Publisher name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Book description..."
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>Tags</label>
            <div className="tag-input-container">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add tags and press Enter"
              />
              <button
                type="button"
                onClick={() => handleAddTag(tagInput.trim())}
                className="tag-add-btn"
              >
                Add
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
                      aria-label={`Remove ${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="want-to-read">Want to Read</option>
                <option value="reading">Reading</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="rating">Rating</label>
              <div className="rating-selector">
                <select
                  id="rating"
                  name="rating"
                  value={formData.rating}
                  onChange={handleChange}
                >
                  <option value="0">0 - Not rated</option>
                  <option value="1">1 - Poor</option>
                  <option value="2">2 - Fair</option>
                  <option value="3">3 - Good</option>
                  <option value="4">4 - Very Good</option>
                  <option value="5">5 - Excellent</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="language">Language</label>
            <input
              id="language"
              type="text"
              name="language"
              value={formData.language}
              onChange={handleChange}
              placeholder="Language"
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
              <span>Make this book private</span>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn">
              {book ? 'Save Changes' : 'Add Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
