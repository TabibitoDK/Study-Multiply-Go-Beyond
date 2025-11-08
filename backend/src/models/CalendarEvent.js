import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  startTime: {
    type: String,
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  endTime: {
    type: String,
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  category: {
    type: String,
    enum: ['study', 'exam', 'assignment', 'other'],
    default: 'study'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  completed: {
    type: Boolean,
    default: false
  },
  relatedBookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  },
  relatedTaskId: {
    type: String
  },
  color: {
    type: String,
    match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  },
  reminder: {
    enabled: {
      type: Boolean,
      default: false
    },
    minutesBefore: {
      type: Number,
      min: 0,
      default: 15
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const calendarEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/
  },
  events: [eventSchema]
}, {
  timestamps: true
});

// Indexes
calendarEventSchema.index({ userId: 1 });
calendarEventSchema.index({ userId: 1, date: 1 });
calendarEventSchema.index({ "events.category": 1 });
calendarEventSchema.index({ "events.priority": 1 });
calendarEventSchema.index({ "events.relatedBookId": 1 });

const CalendarEvent = mongoose.model('CalendarEvent', calendarEventSchema);

export default CalendarEvent;