import createJsonModel from '../lib/jsonModelFactory.js'

const Post = createJsonModel('Post', {
  collectionName: 'posts',
  defaults: {
    books: () => [],
    likes: 0,
    comments: () => [],
    tags: () => [],
    visibility: 'public',
    isEdited: false
  },
  relations: {
    userId: { ref: 'User' },
    books: { ref: 'Book', isArray: true },
    'comments.userId': { ref: 'User' }
  },
  subDocumentArrays: ['comments'],
  textFields: ['content', 'tags']
})

export default Post
