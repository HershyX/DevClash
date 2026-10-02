import mongoose from 'mongoose';

const topicStatSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true },
    attempts: { type: Number, default: 0, min: 0 },
    solved: { type: Number, default: 0, min: 0 },
    totalAttemptsToSolve: { type: Number, default: 0, min: 0 }, // sum of attempt counts on solve
    totalSolveTimeSec: { type: Number, default: 0, min: 0 },
    recentResults: { type: [Boolean], default: [] }, // last N attempt outcomes, newest last
  },
  { _id: false }
);

const skillProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    topics: { type: [topicStatSchema], default: [] },
    difficultyPerformance: {
      easy: { attempts: { type: Number, default: 0 }, solved: { type: Number, default: 0 }, totalSolveTimeSec: { type: Number, default: 0 } },
      medium: { attempts: { type: Number, default: 0 }, solved: { type: Number, default: 0 }, totalSolveTimeSec: { type: Number, default: 0 } },
      hard: { attempts: { type: Number, default: 0 }, solved: { type: Number, default: 0 }, totalSolveTimeSec: { type: Number, default: 0 } },
    },
    totalProblemsAttempted: { type: Number, default: 0, min: 0 },
    totalProblemsSolved: { type: Number, default: 0, min: 0 },
    totalSolveTimeSec: { type: Number, default: 0, min: 0 },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const SkillProfile = mongoose.model('SkillProfile', skillProfileSchema);

export default SkillProfile;
