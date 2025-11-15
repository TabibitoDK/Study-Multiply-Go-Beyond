import createJsonModel from '../lib/jsonModelFactory.js'

const FlashcardGroup = createJsonModel('FlashcardGroup', {
  collectionName: 'flashcardGroups',
  defaults: {
    cards: () => [],
    nextCardId: 1,
    isPublic: false,
    tags: () => [],
    stats: {
      totalCards: 0,
      masteredCards: 0,
      reviewingCards: 0,
      newCards: 0
    }
  },
  relations: {
    userId: { ref: 'User' }
  },
  subDocumentArrays: ['cards'],
  textFields: ['name', 'description', 'tags', 'cards.question', 'cards.answer']
})

export default FlashcardGroup
