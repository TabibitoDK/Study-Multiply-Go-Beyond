import createJsonModel from '../lib/jsonModelFactory.js'

const CalendarEvent = createJsonModel('CalendarEvent', {
  collectionName: 'calendarEvents',
  defaults: {
    events: () => []
  },
  relations: {
    userId: { ref: 'User' },
    'events.relatedBookId': { ref: 'Book' }
  },
  subDocumentArrays: ['events'],
  textFields: ['events.title', 'events.description', 'events.category']
})

export default CalendarEvent
