import createJsonModel from '../lib/jsonModelFactory.js'

const FlashcardAISettings = createJsonModel('FlashcardAISettings', {
  collectionName: 'flashcardAISettings',
  defaults: {
    language: 'en',
    preferences: {
      defaultCardCount: 10,
      difficulty: 'intermediate',
      includeImages: false,
      autoTranslate: false
    },
    usageStats: {
      totalCardsGenerated: 0,
      monthlyUsage: () => []
    }
  },
  relations: {
    userId: { ref: 'User' }
  },
  subDocumentArrays: ['usageStats.monthlyUsage']
})

export default FlashcardAISettings
