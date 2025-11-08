import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    trim: true,
    maxlength: 100
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_]+$/
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 500
  },
  profileImage: {
    type: String,
    trim: true
  },
  backgroundImage: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true,
    maxlength: 100
  },
  joined: {
    type: Date,
    default: Date.now
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  posts: {
    type: Number,
    min: 0,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  socialLinks: {
    website: {
      type: String,
      trim: true,
      match: /^https?:\/\/.+/
    },
    twitter: {
      type: String,
      trim: true
    },
    github: {
      type: String,
      trim: true
    }
  },
  stats: {
    booksRead: {
      type: Number,
      min: 0,
      default: 0
    },
    studyStreak: {
      type: Number,
      min: 0,
      default: 0
    },
    totalStudyHours: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  privacy: {
    showEmail: {
      type: Boolean,
      default: false
    },
    showLocation: {
      type: Boolean,
      default: true
    },
    allowFollowers: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Indexes
profileSchema.index({ userId: 1 }, { unique: true });
profileSchema.index({ username: 1 }, { unique: true });
profileSchema.index({ followers: 1 });
profileSchema.index({ following: 1 });
profileSchema.index({ tags: 1 });

const Profile = mongoose.model('Profile', profileSchema);

export default Profile;