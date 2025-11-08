import mongoose from 'mongoose';

const edgeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true
  },
  target: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['dependency', 'sequence', 'related'],
    default: 'dependency'
  },
  style: {
    type: {
      type: String,
      enum: ['straight', 'smoothstep', 'bezier'],
      default: 'straight'
    },
    animated: {
      type: Boolean,
      default: false
    },
    color: {
      type: String,
      match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
      default: '#000000'
    },
    width: {
      type: Number,
      min: 1,
      max: 10,
      default: 2
    }
  },
  label: {
    type: String,
    trim: true,
    maxlength: 100
  }
}, {
  timestamps: true
});

const flowEdgeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskPlan',
    required: true
  },
  edges: [edgeSchema]
}, {
  timestamps: true
});

// Indexes
flowEdgeSchema.index({ userId: 1 });
flowEdgeSchema.index({ planId: 1 }, { unique: true });

const FlowEdge = mongoose.model('FlowEdge', flowEdgeSchema);

export default FlowEdge;