import createJsonModel from '../lib/jsonModelFactory.js'

const FlowEdge = createJsonModel('FlowEdge', {
  collectionName: 'flowEdges',
  defaults: {
    edges: () => []
  },
  relations: {
    userId: { ref: 'User' },
    planId: { ref: 'TaskPlan' }
  },
  subDocumentArrays: ['edges'],
  textFields: ['edges.label']
})

export default FlowEdge
