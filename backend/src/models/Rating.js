import mongoose from 'mongoose';

/**
 * Rating — a persistent ledger of every rating change across the three
 * ladders. Powers rating history charts and analytics without having to
 * recompute from raw events.
 */
const ratingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ladder: {
      type: String,
      enum: ['duel', 'problemSet', 'adaptive'],
      required: true,
      index: true,
    },
    ratingBefore: { type: Number, required: true },
    ratingAfter: { type: Number, required: true },
    delta: { type: Number, required: true },
    xpGained: { type: Number, default: 0, min: 0 },
    reason: {
      type: String,
      enum: ['battle', 'problem-solved', 'adaptive-session', 'adjustment'],
      required: true,
    },
    refId: { type: mongoose.Schema.Types.ObjectId, default: null }, // battle/problem/session id
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

ratingSchema.index({ user: 1, ladder: 1, createdAt: -1 });

const Rating = mongoose.model('Rating', ratingSchema);

export default Rating;
