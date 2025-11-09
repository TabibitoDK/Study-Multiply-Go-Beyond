import mongoose from 'mongoose'

const chatMessageSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['direct', 'group'],
      required: true,
    },
    conversationKey: {
      type: String,
      index: true,
      sparse: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyGroup',
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    image: {
      type: String,
      trim: true,
    },
    deliveredAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    timestamps: true,
  },
)

chatMessageSchema.index({ type: 1, groupId: 1, createdAt: 1 })
chatMessageSchema.index({ type: 1, participants: 1, createdAt: 1 })

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema)

export default ChatMessage
