import createJsonModel from '../lib/jsonModelFactory.js'

const Profile = createJsonModel('Profile', {
  collectionName: 'profiles',
  defaults: {
    followers: () => [],
    following: () => [],
    posts: 0,
    tags: () => [],
    socialLinks: {},
    stats: {
      booksRead: 0,
      studyStreak: 0,
      totalStudyHours: 0
    },
    privacy: {
      showEmail: false,
      showLocation: true,
      allowFollowers: true
    }
  },
  relations: {
    userId: { ref: 'User' },
    followers: { ref: 'User', isArray: true },
    following: { ref: 'User', isArray: true }
  },
  textFields: ['name', 'username', 'bio', 'location', 'tags']
})

export default Profile
