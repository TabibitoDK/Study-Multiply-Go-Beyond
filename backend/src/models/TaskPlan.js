import mongoose from 'mongoose';

const subtaskSchema = new mongoose.Schema({
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
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  }
});

const taskSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed'],
    default: 'not-started'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  startAt: {
    type: Date
  },
  dueDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  estimatedHours: {
    type: Number,
    min: 0
  },
  actualHours: {
    type: Number,
    min: 0,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  dependencies: [{
    type: String
  }],
  relatedBookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  },
  subtasks: [subtaskSchema]
}, {
  timestamps: true
});

const taskPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed', 'paused'],
    default: 'not-started'
  },
  tasks: [taskSchema],
  dueDate: {
    type: Date
  },
  category: {
    type: String,
    enum: ['academic', 'personal', 'work'],
    default: 'academic'
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
taskPlanSchema.index({ userId: 1 });
taskPlanSchema.index({ userId: 1, status: 1 });
taskPlanSchema.index({ "tasks.dueDate": 1 });
taskPlanSchema.index({ "tasks.status": 1 });
taskPlanSchema.index({ dueDate: 1 });
taskPlanSchema.index({ tags: 1 });

const TaskPlan = mongoose.model('TaskPlan', taskPlanSchema);

export default TaskPlan;