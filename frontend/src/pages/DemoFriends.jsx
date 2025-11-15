import { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronRight, Send, Image, X } from 'lucide-react'

// Sample demo data
const demoFriends = [
  {
    id: '1',
    name: 'Alex Chen',
    username: 'alexchen',
    avatar: '',
    status: 'online',
    activity: 'Studying physics'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    username: 'sarahj',
    avatar: '',
    status: 'online',
    activity: 'Writing notes'
  },
  {
    id: '3',
    name: 'Michael Park',
    username: 'mpark',
    avatar: '',
    status: 'offline',
    activity: 'Last seen 2h ago'
  },
  {
    id: '4',
    name: 'Emma Wilson',
    username: 'emmaw',
    avatar: '',
    status: 'online',
    activity: 'In a study session'
  },
  {
    id: '5',
    name: 'James Taylor',
    username: 'jtaylor',
    avatar: '',
    status: 'offline',
    activity: 'Last seen yesterday'
  }
]

const demoGroups = [
  {
    id: 'g1',
    name: 'English Presentation',
    memberCount: 8,
    avatar: '',
    description: 'Working on final presentation'
  },
  {
    id: 'g2',
    name: 'Physics Study Group',
    memberCount: 5,
    avatar: '',
    description: 'Weekly physics problems'
  },
  {
    id: 'g3',
    name: 'Math Club',
    memberCount: 12,
    avatar: '',
    description: 'Advanced mathematics'
  }
]

const demoMessages = {
  '1': [
    { id: 'm1', senderId: '1', text: 'Hey! How\'s the studying going?', timestamp: new Date(Date.now() - 3600000).toISOString(), isOwn: false },
    { id: 'm2', senderId: 'me', text: 'Pretty good! Just reviewing some physics concepts.', timestamp: new Date(Date.now() - 3000000).toISOString(), isOwn: true },
    { id: 'm3', senderId: '1', text: 'Nice! Need any help with quantum mechanics?', timestamp: new Date(Date.now() - 2400000).toISOString(), isOwn: false },
    { id: 'm4', senderId: 'me', text: 'That would be great! I\'m struggling with wave functions.', timestamp: new Date(Date.now() - 1800000).toISOString(), isOwn: true }
  ],
  '2': [
    { id: 'm5', senderId: '2', text: 'Did you finish the essay?', timestamp: new Date(Date.now() - 7200000).toISOString(), isOwn: false },
    { id: 'm6', senderId: 'me', text: 'Almost done! Just need to edit the conclusion.', timestamp: new Date(Date.now() - 6000000).toISOString(), isOwn: true },
    { id: 'm7', senderId: '2', text: 'Let me know if you want me to proofread it!', timestamp: new Date(Date.now() - 5400000).toISOString(), isOwn: false }
  ],
  'g1': [
    { id: 'm8', senderId: 'user1', senderName: 'David', text: 'Has everyone decided on their part of the presentation?', timestamp: new Date(Date.now() - 10800000).toISOString(), isOwn: false },
    { id: 'm9', senderId: 'user2', senderName: 'Lisa', text: 'I\'m doing the introduction and conclusion', timestamp: new Date(Date.now() - 9000000).toISOString(), isOwn: false },
    { id: 'm10', senderId: 'me', text: 'I can handle the main body content about Shakespeare\'s influence', timestamp: new Date(Date.now() - 7200000).toISOString(), isOwn: true },
    { id: 'm11', senderId: 'user3', senderName: 'Tom', text: 'Perfect! I\'ll work on the visual aids', timestamp: new Date(Date.now() - 3600000).toISOString(), isOwn: false }
  ],
  'g2': [
    { id: 'm12', senderId: 'user4', senderName: 'Prof. Smith', text: 'Don\'t forget about the problem set due Friday', timestamp: new Date(Date.now() - 86400000).toISOString(), isOwn: false },
    { id: 'm13', senderId: 'me', text: 'Thanks for the reminder! I\'ll start working on it tonight', timestamp: new Date(Date.now() - 43200000).toISOString(), isOwn: true }
  ]
}

export default function DemoFriends() {
  const [selectedChat, setSelectedChat] = useState(null)
  const [messageText, setMessageText] = useState('')
  const [messages, setMessages] = useState([])
  const [expandedSections, setExpandedSections] = useState({
    friends: true,
    groups: true
  })
  const [selectedImage, setSelectedImage] = useState(null)
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)

  const onlineFriends = demoFriends.filter(friend => friend.status === 'online')
  const offlineFriends = demoFriends.filter(friend => friend.status !== 'online')

  useEffect(() => {
    if (selectedChat) {
      setMessages(demoMessages[selectedChat.id] || [])
    }
  }, [selectedChat])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleChatSelect = (chat) => {
    setSelectedChat(chat)
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!messageText.trim() && !selectedImage) return

    const newMessage = {
      id: `m${Date.now()}`,
      senderId: 'me',
      text: messageText.trim(),
      timestamp: new Date().toISOString(),
      isOwn: true
    }

    setMessages(prev => [...prev, newMessage])
    setMessageText('')
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    // Simulate a response after a delay
    setTimeout(() => {
      const responses = [
        "That's interesting! Tell me more.",
        "I agree with your point.",
        "Have you considered the other perspective?",
        "Great idea! Let's discuss this further.",
        "Thanks for sharing that with me."
      ]
      const responseMessage = {
        id: `m${Date.now() + 1}`,
        senderId: selectedChat.id,
        senderName: selectedChat.name,
        text: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date().toISOString(),
        isOwn: false
      }
      setMessages(prev => [...prev, responseMessage])
    }, 1500)
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

  const renderFriendCard = (friend) => {
    const isOnline = friend.status === 'online'
    return (
      <button
        key={friend.id}
        type="button"
        className={`friend-card panel-button ${isOnline ? 'friend-card--online' : 'friend-card--offline'}`}
        onClick={() => handleChatSelect(friend)}
      >
        <div
          className="friend-card__avatar"
          style={friend.avatar ? { backgroundImage: `url(${friend.avatar})` } : undefined}
        >
          <span className={`friend-card__status-dot ${isOnline ? 'friend-card__status-dot--online' : 'friend-card__status-dot--offline'}`} />
        </div>
        <div className="friend-card__body">
          <div className="friend-card__top">
            <span className="friend-card__name">{friend.name}</span>
            <span className="friend-card__chip">{isOnline ? friend.activity : 'Offline'}</span>
          </div>
          <span className="friend-card__status">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        <svg
          className="friend-card__chevron"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    )
  }

  const renderGroupCard = (group) => {
    const initials = group.name
      .split(' ')
      .map(part => part[0])
      .filter(Boolean)
      .join('')
      .slice(0, 2)
      .toUpperCase()

    return (
      <button
        key={group.id}
        type="button"
        className="group-card panel-button"
        onClick={() => handleChatSelect(group)}
      >
        <div
          className="group-card__avatar"
          style={group.avatar ? { backgroundImage: `url(${group.avatar})` } : undefined}
        >
          {!group.avatar && <span className="group-card__initials">{initials}</span>}
        </div>
        <div className="group-card__body">
          <span className="group-card__name">{group.name}</span>
          <span className="group-card__meta">
            {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>
        <svg
          className="group-card__chevron"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    )
  }

  const renderSectionHeader = (title, count, sectionKey) => {
    const isExpanded = expandedSections[sectionKey]
    const ChevronIcon = isExpanded ? ChevronDown : ChevronRight

    return (
      <button
        type="button"
        className="friends-panel__section-header friends-panel__section-header--clickable"
        onClick={() => toggleSection(sectionKey)}
        aria-expanded={isExpanded}
        aria-controls={`${sectionKey}-section-content`}
      >
        <div className="friends-panel__section-title-container">
          <ChevronIcon 
            size={16} 
            className="friends-panel__section-chevron"
          />
          <span className="friends-panel__section-title">{title}</span>
        </div>
        {count > 0 && <span className="friends-panel__section-count">{count}</span>}
      </button>
    )
  }

  return (
    <div className="demo-friends-container" style={{ display: 'flex', height: '100%', gap: '20px' }}>
      {/* Left Column - Friends Sidebar */}
      <aside className="panel friends-panel" style={{ width: '320px', flexShrink: 0 }}>
        <header className="friends-panel__header">
          <div className="friends-panel__title">
            Friends & Groups
          </div>
        </header>

        <div className="friends-panel__collapsible-container">
          {/* Friends Section */}
          <section className="friends-panel__section friends-panel__section--primary">
            {renderSectionHeader('Friends', demoFriends.length, 'friends')}
            
            <div
              id="friends-section-content"
              className={`friends-panel__collapsible-content ${expandedSections.friends ? 'friends-panel__collapsible-content--expanded' : 'friends-panel__collapsible-content--collapsed'}`}
              aria-hidden={!expandedSections.friends}
            >
              <div className="friends-panel__scrollable-wrapper">
                <div className="friends-panel__subsection">
                  <div className="friends-panel__subsection-heading">
                    <span className="friends-panel__subsection-title">Online</span>
                    <span className="friends-panel__subsection-count">{onlineFriends.length}</span>
                  </div>

                  {onlineFriends.length === 0 ? (
                    <p className="friends-panel__empty">No one is online</p>
                  ) : (
                    <div className="friends-panel__list">
                      {onlineFriends.map(renderFriendCard)}
                    </div>
                  )}
                </div>

                <div className="friends-panel__subsection">
                  <div className="friends-panel__subsection-heading">
                    <span className="friends-panel__subsection-title">Offline</span>
                    <span className="friends-panel__subsection-count">{offlineFriends.length}</span>
                  </div>

                  {offlineFriends.length === 0 ? (
                    <p className="friends-panel__empty">No offline friends</p>
                  ) : (
                    <div className="friends-panel__list">
                      {offlineFriends.map(renderFriendCard)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Groups Section */}
          <section className="friends-panel__section friends-panel__section--groups">
            {renderSectionHeader('Groups', demoGroups.length, 'groups')}
            
            <div
              id="groups-section-content"
              className={`friends-panel__collapsible-content ${expandedSections.groups ? 'friends-panel__collapsible-content--expanded' : 'friends-panel__collapsible-content--collapsed'}`}
              aria-hidden={!expandedSections.groups}
            >
              <div className="friends-panel__scrollable-wrapper groups-scrollable-wrapper">
                {demoGroups.length === 0 ? (
                  <p className="friends-panel__empty">No groups yet</p>
                ) : (
                  <div className="friends-panel__list">
                    {demoGroups.map(renderGroupCard)}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </aside>

      {/* Right Column - Chat Interface */}
      <div className="chat-page" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedChat ? (
          <>
            <div className="chat-header">
              <div
                className="chat-header-avatar"
                style={
                  selectedChat.avatar || selectedChat.image
                    ? { backgroundImage: `url(${selectedChat.avatar || selectedChat.image})` }
                    : undefined
                }
              />
              <div className="chat-header-info">
                <div className="chat-header-name">{selectedChat.name}</div>
                {selectedChat.status ? (
                  <div className="chat-header-status">
                    {selectedChat.status === 'online' ? 'Online' : 'Offline'}
                    {selectedChat.activity && ` - ${selectedChat.activity}`}
                  </div>
                ) : (
                  <div className="chat-header-status">{selectedChat.memberCount} members</div>
                )}
              </div>
            </div>

            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="chat-placeholder">No messages yet. Say hi!</div>
              ) : (
                messages.map(message => (
                  <div key={message.id} className={`chat-message ${message.isOwn ? 'own' : 'other'}`}>
                    {!message.isOwn && selectedChat.id.startsWith('g') && (
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
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-form" onSubmit={handleSendMessage}>
              {selectedImage && (
                <div className="chat-image-preview">
                  <img src={selectedImage} alt="Preview" />
                  <button type="button" className="chat-image-remove" onClick={handleRemoveImage}>
                    <X size={16} />
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
                  <Image size={20} />
                </button>
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                />
                <button type="submit" className="btn" disabled={!messageText.trim() && !selectedImage}>
                  <Send size={16} style={{ marginRight: '4px' }} />
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="chat-error" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <h2>Select a chat to start messaging</h2>
            <p>Choose a friend or group from the sidebar to begin your conversation</p>
          </div>
        )}
      </div>
    </div>
  )
}