import mongoose from 'mongoose';

const exampleSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String, default: '' },
  },
  { _id: false }
);

const testCaseSchema = new mongoose.Schema(
  {
    id: { type: String },
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isPublic: { type: Boolean, default: false },
    // Per-test resource ceilings (ms). 0/null = problem default.
    timeLimitMs: { type: Number, default: 0 },
  },
  { _id: true }
);

const problemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true, index: true },
    topics: { type: [String], default: [], index: true }, // canonical topic names for the adaptive engine
    tags: { type: [String], default: [] }, // free-form display tags (kept in sync with topics when omitted)
    constraints: { type: String, default: '' },
    examples: { type: [exampleSchema], default: [] },
    hints: { type: [String], default: [] },
    starterCode: {
      type: Map,
      of: String,
      default: {},
    },
    supportedLanguages: {
      type: [String],
      enum: ['javascript', 'python'],
      default: ['javascript', 'python'],
    },
    xpReward: {
      easy: { type: Number, default: 50, min: 0 },
      medium: { type: Number, default: 120, min: 0 },
      hard: { type: Number, default: 200, min: 0 },
    },
    defaultTimeLimitMs: { type: Number, default: 5000, min: 100 },
    testCases: { type: [testCaseSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isActive: { type: Boolean, default: true },
    statistics: {
      totalSubmissions: { type: Number, default: 0, min: 0 },
      acceptedSubmissions: { type: Number, default: 0, min: 0 },
      acceptanceRate: { type: Number, default: 0, min: 0, max: 100 },
      averageTime: { type: Number, default: 0, min: 0 },
      averageMemory: { type: Number, default: 0, min: 0 },
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

problemSchema.index({ title: 'text', topics: 'text' });
// Filtering active problems is a very common query pattern
problemSchema.index({ isActive: 1, difficulty: 1 });
problemSchema.index({ isActive: 1, createdAt: 1 });

const Problem = mongoose.model('Problem', problemSchema);

export default Problem;
