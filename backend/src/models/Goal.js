import createJsonModel from '../lib/jsonModelFactory.js'

const Goal = createJsonModel('Goal', {
  collectionName: 'goals',
  defaults: {
    isPublic: false,
    category: 'personal',
    priority: 'medium',
    status: 'active',
    progress: 0
  },
  relations: {
    userId: { ref: 'User' }
  },
  textFields: ['text', 'category']
})

export default Goal
