import createJsonModel from '../lib/jsonModelFactory.js'

const User = createJsonModel('User', {
  collectionName: 'users',
  defaults: {
    name: '',
    profileImage: '',
    isActive: true,
    preferences: {
      language: 'en',
      theme: 'light',
      timezone: 'UTC'
    }
  },
  textFields: ['username', 'email', 'name']
})

export default User
