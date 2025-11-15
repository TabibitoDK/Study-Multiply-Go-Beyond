import createJsonModel from '../lib/jsonModelFactory.js'

const User = createJsonModel('User', {
  collectionName: 'users',
  defaults: {
    isActive: true,
    preferences: {
      language: 'en',
      theme: 'light',
      timezone: 'UTC'
    }
  },
  textFields: ['username', 'email']
})

export default User
