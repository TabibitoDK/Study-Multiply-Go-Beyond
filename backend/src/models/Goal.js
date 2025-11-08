import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 500
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    enum: ['academic', 'personal', 'career'],
    default: 'personal'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  targetDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
goalSchema.index({ userId: 1 });
goalSchema.index({ userId: 1, status: 1 });
goalSchema.index({ userId: 1, isPublic: 1 });
goalSchema.index({ targetDate: 1 });
goalSchema.index({ createdAt: -1 });

const Goal = mongoose.model('Goal', goalSchema);

export default Goal;