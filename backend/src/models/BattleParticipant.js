import mongoose from 'mongoose';

/**
 * BattleParticipant — normalized per-participant battle record. Battles also
 * embed a denormalized participant snapshot for fast reads; this collection is
 * the queryable source of truth for per-user battle history and stats.
 */
const battleParticipantSchema = new mongoose.Schema(
  {
    battle: { type: mongoose.Schema.Types.ObjectId, ref: 'Battle', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    isBot: { type: Boolean, default: false },
    ratingBefore: { type: Number, default: 1200 },
    ratingAfter: { type: Number, default: 1200 },
    ratingDelta: { type: Number, default: 0 },
    xpEarned: { type: Number, default: 0, min: 0 },
    isWinner: { type: Boolean, default: false },
    score: { type: Number, default: 0, min: 0, max: 100 },
    testCasesPassed: { type: Number, default: 0, min: 0 },
    totalTestCases: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['connected', 'coding', 'submitted', 'passed', 'failed', 'disconnected'],
      default: 'connected',
    },
  },
  { timestamps: true }
);

battleParticipantSchema.index({ battle: 1, user: 1 }, { unique: true });

const BattleParticipant = mongoose.model('BattleParticipant', battleParticipantSchema);

export default BattleParticipant;
