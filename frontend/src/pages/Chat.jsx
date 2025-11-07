import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProfileById } from '../lib/profiles.js'

export default function Chat({ currentUserId, friends, groups }) {
  const { type, id } = useParams()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  // Get chat recipient info
  const chatInfo = type === 'friend'
    ? friends.find(f => f.id === Number(id))
    : groups.find(g => g.id === id)

  const currentUser = getProfileById(currentUserId)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load sample messages (in real app, this would be from a database)
  useEffect(() => {
    if (type === 'friend' && chatInfo) {
      setMessages([
        {
          id: 1,
          senderId: chatInfo.id,
          senderName: chatInfo.name,
          text: 'Hey! How are you doing?',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 2,
          senderId: currentUserId,
          senderName: currentUser.name,
          text: "I'm good! Working on some projects. How about you?",
          timestamp: new Date(Date.now() - 3000000).toISOString(),
        },
      ])
    } else if (type === 'group' && chatInfo) {
      setMessages([
        {
          id: 1,
          senderId: 2,
          senderName: 'Jane Smith',
          text: 'Welcome to the group!',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
      ])
    }
  }, [type, id, chatInfo, currentUserId, currentUser])

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!messageText.trim() && !selectedImage) return

    const newMessage = {
      id: Date.now(),
      senderId: currentUserId,
      senderName: currentUser.name,
      text: messageText.trim(),
      image: selectedImage,
      timestamp: new Date().toISOString(),
    }

    setMessages([...messages, newMessage])
    setMessageText('')
    setSelectedImage(null)
  }

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (!chatInfo) {
    return (
      <div className="chat-page">
        <div className="chat-error">
          <h2>Chat not found</h2>
          <button className="btn" onClick={() => navigate('/social')}>
            Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-page">
      {/* Chat Header */}
      <div className="chat-header">
        <button className="icon-btn" onClick={() => navigate(-1)} title="Go back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div
          className="chat-header-avatar"
          style={chatInfo.profileImage || chatInfo.image ? { backgroundImage: `url(${chatInfo.profileImage || chatInfo.image})` } : undefined}
        />
        <div className="chat-header-info">
          <div className="chat-header-name">{chatInfo.name}</div>
          {type === 'friend' && (
            <div className="chat-header-status">
              {chatInfo.status === 'online' ? '🟢 Online' : '⚫ Offline'}
              {chatInfo.activity && ` • ${chatInfo.activity}`}
            </div>
          )}
          {type === 'group' && (
            <div className="chat-header-status">{chatInfo.memberCount} members</div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages">
        {messages.map(message => {
          const isOwn = message.senderId === currentUserId
          return (
            <div key={message.id} className={`chat-message ${isOwn ? 'own' : 'other'}`}>
              {!isOwn && type === 'group' && (
                <div className="chat-message-sender">{message.senderName}</div>
              )}
              <div className="chat-message-bubble">
                {message.text && <div className="chat-message-text">{message.text}</div>}
                {message.image && (
                  <img src={message.image} alt="Shared" className="chat-message-image" />
                )}
                <div className="chat-message-time">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form className="chat-input-form" onSubmit={handleSendMessage}>
        {selectedImage && (
          <div className="chat-image-preview">
            <img src={selectedImage} alt="Preview" />
            <button type="button" className="chat-image-remove" onClick={handleRemoveImage}>
              ✕
            </button>
          </div>
        )}
        <div className="chat-input-row">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="icon-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Attach image"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </button>
          <input
            type="text"
            className="chat-input"
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
          />
          <button type="submit" className="btn" disabled={!messageText.trim() && !selectedImage}>
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
