import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Upload, Trash2, Save } from 'lucide-react'
import './ProfileEditModal.css'

const getInitials = name => {
  if (!name) return '?'
  return name
    .split(' ')
    .map(part => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function ProfileBasicsModal({ open, onClose, onSubmit, initialProfile }) {
  const { t } = useTranslation()
  const [name, setName] = useState(initialProfile?.name || '')
  const [preview, setPreview] = useState(initialProfile?.profileImage || '')
  const [imageData, setImageData] = useState(initialProfile?.profileImage || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      const sourceName = initialProfile?.name || ''
      const sourceImage = initialProfile?.profileImage || ''
      setName(sourceName)
      setPreview(sourceImage)
      setImageData(sourceImage)
      setError(null)
    }
  }, [open, initialProfile])

  if (!open) return null

  const handleClose = (force = false) => {
    if (force || !saving) {
      onClose?.()
    }
  }

  const handleFileChange = event => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError(t('profile.edit.imageOnly', { defaultValue: 'Please choose a valid image file.' }))
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result)
      setImageData(reader.result)
    }
    reader.onerror = () => {
      setError(
        t('profile.edit.imageReadError', {
          defaultValue: 'Unable to read the selected file. Please try a different image.',
        }),
      )
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setPreview('')
    setImageData('')
  }

  const handleSubmit = async event => {
    event.preventDefault()
    const trimmedName = (name || '').trim()
    if (!trimmedName) {
      setError(
        t('profile.edit.nameRequired', { defaultValue: 'Please enter your display name.' }),
      )
      return
    }

    if (typeof onSubmit !== 'function') {
      handleClose()
      return
    }

    setSaving(true)
    setError(null)
    try {
      await onSubmit({
        name: trimmedName,
        profileImage: imageData || '',
      })
      handleClose(true)
    } catch (submitError) {
      setError(submitError.message || t('profile.edit.saveError', { defaultValue: 'Failed to save profile changes.' }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={() => handleClose()}>
      <div className="modal-content profile-basics-modal" onClick={event => event.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('profile.edit.basicsTitle', { defaultValue: 'Edit profile' })}</h2>
          <button type="button" className="modal-close-btn" onClick={() => handleClose()} aria-label="Close edit profile dialog">
            <X size={20} />
          </button>
        </div>

        <form className="profile-basics-form" onSubmit={handleSubmit}>
          <div className="modal-body profile-basics-body">
            <div className="profile-basics-avatar-row">
              <div className="profile-basics-avatar" aria-label="Profile image preview">
                {preview ? (
                  <img src={preview} alt="Profile preview" />
                ) : (
                  <span>{getInitials(name || initialProfile?.name)}</span>
                )}
              </div>
              <div className="profile-basics-avatar-actions">
                <label className="profile-basics-upload-btn">
                  <Upload size={16} />
                  <span>{t('profile.edit.choosePhoto', { defaultValue: 'Choose photo' })}</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} />
                </label>
                {preview && (
                  <button type="button" className="profile-basics-reset-btn" onClick={handleRemovePhoto}>
                    <Trash2 size={16} />
                    <span>{t('profile.edit.removePhoto', { defaultValue: 'Remove photo' })}</span>
                  </button>
                )}
                <p className="profile-basics-hint">
                  {t('profile.edit.photoHint', { defaultValue: 'Upload PNG or JPG files under 2MB.' })}
                </p>
              </div>
            </div>

            <label className="profile-basics-field">
              <span className="profile-basics-field-label">
                {t('profile.edit.displayName', { defaultValue: 'Display name' })}
              </span>
              <input
                type="text"
                value={name}
                onChange={event => setName(event.target.value)}
                maxLength={80}
                placeholder={t('profile.edit.displayNamePlaceholder', {
                  defaultValue: 'How should others address you?',
                })}
                className="profile-basics-input"
              />
            </label>

            {error && <p className="profile-basics-error">{error}</p>}
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={() => handleClose()} disabled={saving}>
              {t('buttons.cancel', { defaultValue: 'Cancel' })}
            </button>
            <button type="submit" className="save-btn" disabled={saving}>
              <Save size={18} />
              {saving
                ? t('profile.edit.saving', { defaultValue: 'Saving...' })
                : t('profile.edit.save', { defaultValue: 'Save changes' })}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
