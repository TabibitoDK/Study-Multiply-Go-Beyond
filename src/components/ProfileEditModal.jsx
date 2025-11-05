import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Globe, Lock, Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import './ProfileEditModal.css'

export default function ProfileEditModal({
  open,
  onClose,
  onSave,
  type, // 'bio', 'interests', 'goals'
  initialValue
}) {
  const { t } = useTranslation()
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
      case 'bio':
        return t('profile.edit.bioTitle', { defaultValue: 'Edit Bio' })
      case 'interests':
        return t('profile.edit.interestsTitle', { defaultValue: 'Edit Interests' })
      case 'goals':
        return t('profile.edit.goalsTitle', { defaultValue: 'Edit Goals' })
      default:
        return t('profile.edit.title', { defaultValue: 'Edit' })
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
                placeholder={t('profile.edit.bioPlaceholder', {
                  defaultValue: 'Tell others about yourself...',
                })}
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
                        {t('profile.privacy.public', { defaultValue: 'Public' })}
                      </>
                    ) : (
                      <>
                        <Lock size={16} />
                        {t('profile.privacy.private', { defaultValue: 'Private' })}
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
                  placeholder={t(
                    type === 'interests'
                      ? 'profile.edit.addInterestPlaceholder'
                      : 'profile.edit.addGoalPlaceholder',
                    { defaultValue: type === 'interests' ? 'Add an interest...' : 'Add a goal...' },
                  )}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                />
                <button type="button" className="add-btn" onClick={handleAddItem}>
                  <Plus size={18} />
                  {t('profile.edit.addButton', { defaultValue: 'Add' })}
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
                        title={item.isPublic
                          ? t('profile.edit.makePrivate', { defaultValue: 'Public - Click to make private' })
                          : t('profile.edit.makePublic', { defaultValue: 'Private - Click to make public' })}
                      >
                        {item.isPublic ? <Globe size={16} /> : <Lock size={16} />}
                      </button>
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => handleRemoveItem(index)}
                        title={t('profile.edit.remove', { defaultValue: 'Remove' })}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="empty-message">
                    {t(
                      type === 'interests' ? 'profile.edit.interestsEmpty' : 'profile.edit.goalsEmpty',
                      {
                        defaultValue:
                          type === 'interests'
                            ? 'No interests yet. Add some above!'
                            : 'No goals yet. Add some above!',
                      },
                    )}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="cancel-btn" onClick={onClose}>
            {t('buttons.cancel')}
          </button>
          <button type="button" className="save-btn" onClick={handleSave}>
            <Save size={18} />
            {t('profile.edit.save', { defaultValue: 'Save Changes' })}
          </button>
        </div>
      </div>
    </div>
  )
}
