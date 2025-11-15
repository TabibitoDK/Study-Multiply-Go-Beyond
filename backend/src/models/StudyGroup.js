import createJsonModel from '../lib/jsonModelFactory.js'

const StudyGroup = createJsonModel('StudyGroup', {
  collectionName: 'studyGroups',
  defaults: {
    members: () => []
  },
  relations: {
    createdBy: { ref: 'User' },
    members: { ref: 'User', isArray: true }
  },
  textFields: ['name', 'topic', 'description']
})

export default StudyGroup
