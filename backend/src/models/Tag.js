import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50
  },
  category: {
    type: String,
    enum: ['subject', 'skill', 'general'],
    default: 'general'
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200
  },
  color: {
    type: String,
    match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    default: '#007bff'
  },
  usageCount: {
    type: Number,
    min: 0,
    default: 0
  },
  isSystem: {
    type: Boolean,
    default: false
  },
  relatedTags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }]
}, {
  timestamps: true
});

// Indexes
tagSchema.index({ category: 1 });
tagSchema.index({ usageCount: -1 });

const Tag = mongoose.model('Tag', tagSchema);

export default Tag;
