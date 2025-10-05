import { useState } from 'react'
import dayjs from 'dayjs'

export default function PostModal({ open, onClose, onSubmit }) {
  const [text, setText] = useState('')
  const [book, setBook] = useState('')
  const [duration, setDuration] = useState('')
  const [subject, setSubject] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim() && !book && !duration && !subject) return
    const post = {
      id: crypto.randomUUID(),
      authorName: 'Nickname',
      authorHandle: 'username',
      text: text.trim(),
      book: book.trim() || null,
      duration: duration.trim() || null,
      subject: subject.trim() || null,
      images: [],
      createdAt: dayjs().toISOString(),
    }
    onSubmit(post)
    setText('')
    setBook('')
    setDuration('')
    setSubject('')
    onClose()
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">New Study Post</h2>
        <form onSubmit={handleSubmit}>
          <textarea
            className="input textarea"
            placeholder="What did you study today? Share tips, progress, or thoughts…"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="modal-row">
            <input className="input" placeholder="Book / Resource" value={book} onChange={(e) => setBook(e.target.value)} />
            <input className="input" placeholder="Duration (e.g., 45m, 2h)" value={duration} onChange={(e) => setDuration(e.target.value)} />
            <input className="input" placeholder="Subject / Tag" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn">Post</button>
          </div>
        </form>
      </div>
    </div>
  )
}
