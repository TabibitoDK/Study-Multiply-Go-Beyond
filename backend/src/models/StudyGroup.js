import mongoose from 'mongoose'

const studyGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    topic: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    coverImage: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessageAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

studyGroupSchema.index({ name: 1 }, { unique: true })
studyGroupSchema.index({ members: 1 })
studyGroupSchema.index({ lastMessageAt: -1 })

const StudyGroup = mongoose.model('StudyGroup', studyGroupSchema)

export default StudyGroup
