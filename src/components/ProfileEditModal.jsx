import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Globe, Lock, Save } from 'lucide-react'
import './ProfileEditModal.css'

export default function ProfileEditModal({
  open,
  onClose,
  onSave,
  type, // 'bio', 'interests', 'goals'
  initialValue
}) {
  const [value, setValue] = useState(initialValue || '')
  const [items, setItems] = useState(
    type === 'bio' ? [] : (Array.isArray(initialValue) ? initialValue.map(item =>
      typeof item === 'string' ? { text: item, isPublic: true } : item
    ) : [])
  )
  const [bioPrivacy, setBioPrivacy] = useState(true)
  const [newItemText, setNewItemText] = useState('')

  // Update modal data when open or initialValue changes
  useEffect(() => {
    if (open) {
      if (type === 'bio') {
        setValue(initialValue || '')
      } else if (Array.isArray(initialValue)) {
        setItems(initialValue.map(item =>
          typeof item === 'string' ? { text: item, isPublic: true } : item
        ))
      } else {
        setItems([])
      }
      setNewItemText('')
    }
  }, [open, initialValue, type])

  if (!open) return null

  const handleSave = () => {
    if (type === 'bio') {
      onSave({ text: value, isPublic: bioPrivacy })
    } else {
      onSave(items)
    }
    onClose()
  }

  const handleAddItem = () => {
    if (newItemText.trim()) {
      setItems([...items, { text: newItemText.trim(), isPublic: true }])
      setNewItemText('')
    }
  }

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const toggleItemPrivacy = (index) => {
    setItems(items.map((item, i) =>
      i === index ? { ...item, isPublic: !item.isPublic } : item
    ))
  }

  const getTitle = () => {
    switch (type) {
      case 'bio': return 'Edit Bio'
      case 'interests': return 'Edit Interests'
      case 'goals': return 'Edit Goals'
      default: return 'Edit'
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{getTitle()}</h2>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {type === 'bio' ? (
            <>
              <textarea
                className="bio-textarea"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Tell others about yourself..."
                rows={6}
              />
              <div className="privacy-toggle">
                <label className="privacy-label">
                  <input
                    type="checkbox"
                    checked={bioPrivacy}
                    onChange={(e) => setBioPrivacy(e.target.checked)}
                  />
                  <span className="privacy-text">
                    {bioPrivacy ? (
                      <>
                        <Globe size={16} />
                        Public
                      </>
                    ) : (
                      <>
                        <Lock size={16} />
                        Private
                      </>
                    )}
                  </span>
                </label>
              </div>
            </>
          ) : (
            <>
              <div className="add-item-section">
                <input
                  type="text"
                  className="item-input"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder={`Add ${type === 'interests' ? 'an interest' : 'a goal'}...`}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                />
                <button type="button" className="add-btn" onClick={handleAddItem}>
                  <Plus size={18} />
                  Add
                </button>
              </div>

              <div className="items-list">
                {items.map((item, index) => (
                  <div key={index} className="item-row">
                    <span className="item-text">{item.text}</span>
                    <div className="item-actions">
                      <button
                        type="button"
                        className={`privacy-btn ${item.isPublic ? 'public' : 'private'}`}
                        onClick={() => toggleItemPrivacy(index)}
                        title={item.isPublic ? 'Public - Click to make private' : 'Private - Click to make public'}
                      >
                        {item.isPublic ? <Globe size={16} /> : <Lock size={16} />}
                      </button>
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => handleRemoveItem(index)}
                        title="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="empty-message">No {type} yet. Add some above!</p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="save-btn" onClick={handleSave}>
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
