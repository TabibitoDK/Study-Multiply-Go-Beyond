import mongoose from 'mongoose';

const monthlyUsageSchema = new mongoose.Schema({
  month: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}$/
  },
  count: {
    type: Number,
    min: 0,
    default: 0
  }
});

const flashcardAISettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  language: {
    type: String,
    enum: ['en', 'es', 'fr', 'de', 'ja'],
    default: 'en'
  },
  apiKey: {
    type: String,
    trim: true
  },
  preferences: {
    defaultCardCount: {
      type: Number,
      min: 1,
      max: 50,
      default: 10
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate'
    },
    includeImages: {
      type: Boolean,
      default: false
    },
    autoTranslate: {
      type: Boolean,
      default: false
    }
  },
  usageStats: {
    totalCardsGenerated: {
      type: Number,
      min: 0,
      default: 0
    },
    lastUsed: {
      type: Date
    },
    monthlyUsage: [monthlyUsageSchema]
  }
}, {
  timestamps: true
});

// Indexes
flashcardAISettingsSchema.index({ userId: 1 }, { unique: true });

const FlashcardAISettings = mongoose.model('FlashcardAISettings', flashcardAISettingsSchema);

export default FlashcardAISettings;