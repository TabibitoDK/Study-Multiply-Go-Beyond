import createJsonModel from '../lib/jsonModelFactory.js'

const Book = createJsonModel('Book', {
  collectionName: 'books',
  defaults: {
    tags: () => [],
    rating: null,
    status: 'want-to-read',
    visibility: 'public',
    progress: 0,
    favorite: false,
    textLanguage: 'english'
  },
  relations: {
    userId: { ref: 'User' }
  },
  textFields: ['title', 'author', 'description', 'tags', 'userNotes', 'publisher']
})

export default Book
