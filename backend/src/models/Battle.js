import mongoose from 'mongoose';

const battleParticipantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    avatar: { type: String, default: null },
    rating: { type: Number, default: 1200 },
    isBot: { type: Boolean, default: false },
    code: { type: String, default: '' },
    language: { type: String, default: 'javascript' },
    status: {
      type: String,
      enum: ['connected', 'coding', 'submitted', 'passed', 'failed', 'disconnected'],
      default: 'connected',
    },
    score: { type: Number, default: 0, min: 0, max: 100 },
    testCasesPassed: { type: Number, default: 0, min: 0 },
    totalTestCases: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const battleSubmissionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    code: { type: String, default: '' },
    language: { type: String, default: 'javascript' },
    status: { type: String, enum: ['accepted', 'wrong', 'timeout', 'error'], default: 'accepted' },
    score: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const battleSchema = new mongoose.Schema(
  {
    battleCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    mode: { type: String, enum: ['duel', 'practice', 'adaptive'], default: 'duel' },
    status: {
      type: String,
      enum: ['waiting', 'matched', 'active', 'completed', 'cancelled'],
      default: 'waiting',
      index: true,
    },
    isRanked: { type: Boolean, default: true },
    participants: { type: [battleParticipantSchema], default: [] },
    problem: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
    timeLimit: { type: Number, default: 30 }, // minutes
    language: { type: String, default: 'javascript' },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    result: {
      winnerId: { type: String, default: null },
      isVictory: { type: Boolean, default: false },
      scores: { type: Map, of: Number, default: {} },
      duration: { type: Number, default: 0 },
      ratingChange: { type: Number, default: 0 },
      xpGained: { type: Number, default: 0 },
      newRating: { type: Number, default: 0 },
      streak: { type: Number, default: 0 },
      submissions: { type: [battleSubmissionSchema], default: [] },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret.__v;
        if (ret.problem && typeof ret.problem === 'object') {
          ret.problem.id = ret.problem._id?.toString();
        }
        return ret;
      },
    },
  }
);

// battleCode already has a unique index from the field definition; no need to repeat it.
battleSchema.index({ 'participants.user': 1, createdAt: -1 });

const Battle = mongoose.model('Battle', battleSchema);

export default Battle;
