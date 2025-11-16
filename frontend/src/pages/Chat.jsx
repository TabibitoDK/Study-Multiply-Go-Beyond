import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import chatService from '../services/chatService.js'

export default function Chat({ currentUserId, friends, groups }) {
  const { type, id } = useParams()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [error, setError] = useState(null)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  const chatInfo =
    type === 'friend'
      ? friends.find(friend => String(friend.id) === String(id))
      : groups.find(group => String(group.id) === String(id))

  const loadMessages = useCallback(async () => {
    if (!chatInfo || !currentUserId) {
      return
    }

    setLoadingMessages(true)
    setMessages([])

    try {
      const response =
        type === 'friend'
          ? await chatService.getDirectThread(chatInfo.id)
          : await chatService.getGroupMessages(chatInfo.id)

      setMessages(response?.messages || [])
      setError(null)
    } catch (err) {
      console.error('Error loading chat messages:', err)
      setError('Failed to load chat history. Please try again.')
    } finally {
      setLoadingMessages(false)
    }
  }, [chatInfo, currentUserId, type])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async event => {
    event.preventDefault()
    if ((!messageText.trim() && !selectedImage) || !chatInfo) {
      return
    }

    const payload = {
      text: messageText.trim(),
      ...(selectedImage ? { image: selectedImage } : {}),
    }

    try {
      setIsSending(true)
      const meta = {
        senderId: currentUserId,
        senderName: 'You',
      }
      const sentMessage =
        type === 'friend'
          ? await chatService.sendDirectMessage(chatInfo.id, payload, meta)
          : await chatService.sendGroupMessage(chatInfo.id, payload, meta)

      setMessages(prev => [...prev, sentMessage])
      setMessageText('')
      setError(null)
      handleRemoveImage()
    } catch (err) {
      console.error('Error sending chat message:', err)
      setError('Could not send message. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const handleImageSelect = event => {
    const file = event.target.files?.[0]
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
      <div className="chat-header">
        <button className="icon-btn" onClick={() => navigate(-1)} title="Go back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div
          className="chat-header-avatar"
          style={
            chatInfo.profileImage || chatInfo.image
              ? { backgroundImage: `url(${chatInfo.profileImage || chatInfo.image})` }
              : undefined
          }
        />
        <div className="chat-header-info">
          <div className="chat-header-name">{chatInfo.name}</div>
          {type === 'friend' && (
            <div className="chat-header-status">
              {chatInfo.status === 'online' ? 'Online' : 'Offline'}
              {chatInfo.activity && ` - ${chatInfo.activity}`}
            </div>
          )}
          {type === 'group' && <div className="chat-header-status">{chatInfo.memberCount} members</div>}
        </div>
      </div>

      {error && (
        <div className="chat-alert" role="alert">
          {error}
        </div>
      )}

      <div className="chat-messages">
        {loadingMessages ? (
          <div className="chat-placeholder">Loading conversation...</div>
        ) : messages.length === 0 ? (
          <div className="chat-placeholder">No messages yet. Say hi!</div>
        ) : (
          messages.map(message => {
            const isOwn = String(message.senderId) === String(currentUserId)
            return (
              <div key={message.id} className={`chat-message ${isOwn ? 'own' : 'other'}`}>
                {!isOwn && type === 'group' && (
                  <div className="chat-message-sender">{message.senderName}</div>
                )}
                <div className="chat-message-bubble">
                  {message.text && <div className="chat-message-text">{message.text}</div>}
                  {message.image && <img src={message.image} alt="Shared" className="chat-message-image" />}
                  <div className="chat-message-time">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        {selectedImage && (
          <div className="chat-image-preview">
            <img src={selectedImage} alt="Preview" />
            <button type="button" className="chat-image-remove" onClick={handleRemoveImage}>
              x
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
          <button type="button" className="icon-btn" onClick={() => fileInputRef.current?.click()} title="Attach image">
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
            onChange={event => setMessageText(event.target.value)}
          />
          <button type="submit" className="btn" disabled={isSending || (!messageText.trim() && !selectedImage)}>
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
