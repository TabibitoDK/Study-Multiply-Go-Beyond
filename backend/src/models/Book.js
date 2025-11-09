import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 200
  },
  author: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100
  },
  year: {
    type: Number,
    min: 1000,
    max: new Date().getFullYear() + 1
  },
  cover: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  tags: [{
    type: String,
    trim: true
  }],
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  status: {
    type: String,
    enum: ['reading', 'completed', 'want-to-read', 'abandoned'],
    default: 'want-to-read'
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  pages: {
    type: Number,
    min: 1
  },
  publisher: {
    type: String,
    trim: true,
    maxlength: 100
  },
  language: {
    type: String,
    trim: true,
    maxlength: 50
  },
  isbn: {
    type: String,
    trim: true,
    match: /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/
  },
  userNotes: {
    type: String,
    trim: true,
    maxlength: 5000
  },
  startDate: {
    type: Date
  },
  finishDate: {
    type: Date
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  favorite: {
    type: Boolean,
    default: false
  },
  textLanguage: {
    type: String,
    default: 'english',
    select: false
  }
}, {
  timestamps: true,
  languageOverride: 'textLanguage'
});

// Indexes
bookSchema.index({ userId: 1 });
bookSchema.index(
  { title: 'text', author: 'text', description: 'text' },
  { language_override: 'textLanguage', default_language: 'english' },
);
bookSchema.index({ tags: 1 });
bookSchema.index({ status: 1 });
bookSchema.index({ visibility: 1 });
bookSchema.index({ userId: 1, status: 1 });
bookSchema.index({ userId: 1, visibility: 1, rating: -1 });
bookSchema.index({ userId: 1, tags: 1 });

const Book = mongoose.model('Book', bookSchema);

export default Book;
