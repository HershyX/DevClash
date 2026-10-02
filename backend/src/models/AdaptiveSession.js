import mongoose from 'mongoose';

const attemptSchema = new mongoose.Schema(
  {
    problem: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
    problemTitle: { type: String, default: '' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
    status: { type: String, enum: ['solved', 'attempted', 'skipped'], default: 'attempted' },
    timeSpent: { type: Number, default: 0 }, // seconds
    attempts: { type: Number, default: 1, min: 1 },
    ratingChange: { type: Number, default: 0 },
    topic: { type: String, default: null },
    xpEarned: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const adaptiveSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused'],
      default: 'active',
      index: true,
    },
    currentProblem: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', default: null },
    problemsAttempted: { type: [attemptSchema], default: [] },
    /** Structured recommendation rationale from the adaptive engine (topic/difficulty/reason). */
    lastReasoning: { type: mongoose.Schema.Types.Mixed, default: null },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
    skillProfile: {
      strengths: { type: [String], default: [] },
      weaknesses: { type: [String], default: [] },
      recommendedTopics: { type: [String], default: [] },
      estimatedRating: { type: Number, default: 1200 },
      confidence: { type: Number, default: 0.5, min: 0, max: 1 },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

adaptiveSessionSchema.index({ user: 1, status: 1, createdAt: -1 });

const AdaptiveSession = mongoose.model('AdaptiveSession', adaptiveSessionSchema);

export default AdaptiveSession;
