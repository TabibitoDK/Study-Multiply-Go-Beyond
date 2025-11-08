import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  question: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  answer: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  category: {
    type: String,
    trim: true,
    maxlength: 100
  },
  easyCount: {
    type: Number,
    min: 0,
    default: 0
  },
  lastReviewed: {
    type: Date
  },
  nextReview: {
    type: Date
  },
  difficulty: {
    type: Number,
    min: 0,
    max: 2,
    default: 1 // 0=easy, 1=medium, 2=hard
  },
  reviewCount: {
    type: Number,
    min: 0,
    default: 0
  },
  correctCount: {
    type: Number,
    min: 0,
    default: 0
  }
}, {
  timestamps: true
});

const flashcardGroupSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
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
  cards: [cardSchema],
  nextCardId: {
    type: Number,
    min: 1,
    default: 1
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    trim: true,
    maxlength: 100
  },
  tags: [{
    type: String,
    trim: true
  }],
  stats: {
    totalCards: {
      type: Number,
      min: 0,
      default: 0
    },
    masteredCards: {
      type: Number,
      min: 0,
      default: 0
    },
    reviewingCards: {
      type: Number,
      min: 0,
      default: 0
    },
    newCards: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  lastStudiedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
flashcardGroupSchema.index({ userId: 1 });
flashcardGroupSchema.index({ userId: 1, isPublic: 1 });
flashcardGroupSchema.index({ name: "text", description: "text" });
flashcardGroupSchema.index({ category: 1 });
flashcardGroupSchema.index({ tags: 1 });
flashcardGroupSchema.index({ "cards.nextReview": 1 });

const FlashcardGroup = mongoose.model('FlashcardGroup', flashcardGroupSchema);

export default FlashcardGroup;