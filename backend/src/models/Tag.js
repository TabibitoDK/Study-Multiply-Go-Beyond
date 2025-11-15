import createJsonModel from '../lib/jsonModelFactory.js'

const Tag = createJsonModel('Tag', {
  collectionName: 'tags',
  defaults: {
    category: 'general',
    color: '#007bff',
    usageCount: 0,
    isSystem: false,
    relatedTags: () => []
  },
  relations: {
    relatedTags: { ref: 'Tag', isArray: true }
  },
  textFields: ['name', 'description', 'category']
})

export default Tag
