import createJsonModel from '../lib/jsonModelFactory.js'

const ChatMessage = createJsonModel('ChatMessage', {
  collectionName: 'chatMessages',
  defaults: {
    participants: () => [],
    deliveredAt: () => new Date().toISOString()
  },
  relations: {
    participants: { ref: 'User', isArray: true },
    groupId: { ref: 'StudyGroup' },
    senderId: { ref: 'User' }
  },
  textFields: ['text']
})

export default ChatMessage
