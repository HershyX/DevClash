import mongoose from 'mongoose';

/**
 * Submission — one record per user code submission (Run or Submit).
 * Executed in the isolated Docker sandbox by the execution service, never in
 * the API process.
 */
const submissionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    problem: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true, index: true },
    language: { type: String, required: true, enum: ['javascript', 'python'] },
    sourceCode: { type: String, required: true },
    // accepted | wrong | tle (time limit exceeded) | compile_error | runtime_error
    status: {
      type: String,
      enum: ['accepted', 'wrong', 'tle', 'compile_error', 'runtime_error'],
      required: true,
      index: true,
    },
    runtimeMs: { type: Number, default: 0, min: 0 },
    memoryMb: { type: Number, default: 0, min: 0 },
    testCasesPassed: { type: Number, default: 0, min: 0 },
    totalTestCases: { type: Number, default: 0, min: 0 },
    errorMessage: { type: String, default: '' }, // compiler/runtime stderr (sanitized)
    firstTestCaseFailed: { type: Number, default: null }, // 1-based, for Wrong Answer UX
    xpEarned: { type: Number, default: 0, min: 0 },
    ratingDelta: { type: Number, default: 0 },
    mode: { type: String, enum: ['run', 'submit'], default: 'submit' }, // runs aren't rated
    battle: { type: mongoose.Schema.Types.ObjectId, ref: 'Battle', default: null },
    execution: {
      engine: { type: String, default: 'docker' }, // docker | fallback (recorded for auditing)
      containerId: { type: String, default: '' },
      timedOut: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

submissionSchema.index({ user: 1, problem: 1, createdAt: -1 });

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;
