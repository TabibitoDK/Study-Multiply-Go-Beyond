import createJsonModel from '../lib/jsonModelFactory.js'

const TaskPlan = createJsonModel('TaskPlan', {
  collectionName: 'taskPlans',
  defaults: {
    tasks: () => [],
    status: 'not-started',
    category: 'academic',
    tags: () => [],
    isPublic: false
  },
  relations: {
    userId: { ref: 'User' },
    collaborators: { ref: 'User', isArray: true },
    'tasks.relatedBookId': { ref: 'Book' }
  },
  subDocumentArrays: ['tasks', 'tasks.subtasks'],
  textFields: ['title', 'description', 'category', 'tags', 'tasks.title', 'tasks.description']
})

export default TaskPlan
