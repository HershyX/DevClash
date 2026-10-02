import mongoose from 'mongoose';

/**
 * Independent rating/XP/level tracks. DevClash deliberately keeps three
 * separate ladders — duel, problemSet (practice) and adaptive — so a single
 * overall rating is never computed.
 */
const ratingSchema = new mongoose.Schema(
  {
    rating: { type: Number, default: 1200, min: 0 },
    xp: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1 },
    weeklyXpGain: { type: Number, default: 0, min: 0 },
    trend: { type: String, enum: ['up', 'down', 'stable'], default: 'stable' },
  },
  { _id: false }
);

const statisticsSchema = new mongoose.Schema(
  {
    totalBattles: { type: Number, default: 0, min: 0 },
    battlesWon: { type: Number, default: 0, min: 0 },
    battlesLost: { type: Number, default: 0, min: 0 },
    winRate: { type: Number, default: 0, min: 0, max: 100 },
    problemsSolved: { type: Number, default: 0, min: 0 },
    problemsAttempted: { type: Number, default: 0, min: 0 },
    adaptiveSessions: { type: Number, default: 0, min: 0 },
    totalXp: { type: Number, default: 0, min: 0 },
    currentStreak: { type: Number, default: 0, min: 0 },
    maxStreak: { type: Number, default: 0, min: 0 },
    averageRating: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    passwordHash: { type: String, required: true, select: false }, // never returned unless explicitly selected
    role: {
      type: String,
      enum: ['student', 'teacher', 'personal'],
      required: true,
      index: true,
    },
    avatar: { type: String, default: null },
    bio: { type: String, default: '', maxlength: 300 },
    isDemo: { type: Boolean, default: false },

    // Students and personal users carry independent ladder stats;
    // teachers get zeroed placeholders so API shapes stay uniform.
    duelRating: { type: ratingSchema, default: () => ({}) },
    problemSetRating: { type: ratingSchema, default: () => ({}) },
    adaptiveRating: { type: ratingSchema, default: () => ({}) },
    statistics: { type: statisticsSchema, default: () => ({}) },
  },
  {
    timestamps: true, // createdAt / updatedAt
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        ret.id = ret._id.toString();
        return ret;
      },
    },
  }
);

userSchema.virtual('practiceRating').get(function practiceRatingVirtual() {
  return this.problemSetRating;
});

// ── Performance indexes ──────────────────────────────────────────────────────
// Leaderboard queries sort users by each ladder's rating subdocument field.
// Without these indexes, every leaderboard request does a full collection scan.
userSchema.index({ 'duelRating.rating': -1 });
userSchema.index({ 'problemSetRating.rating': -1 });
userSchema.index({ 'adaptiveRating.rating': -1 });

const User = mongoose.model('User', userSchema);

export default User;
