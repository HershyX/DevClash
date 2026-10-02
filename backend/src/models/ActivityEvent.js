import mongoose from 'mongoose';

const activityEventSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: { type: String, default: '' },
    type: {
      type: String,
      enum: ['battle', 'problem', 'adaptive', 'classroom', 'achievement'],
      required: true,
    },
    description: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

activityEventSchema.index({ createdAt: -1 });
// Compound index for per-user activity feed (user + time, most recent first)
activityEventSchema.index({ user: 1, createdAt: -1 });

const ActivityEvent = mongoose.model('ActivityEvent', activityEventSchema);

export default ActivityEvent;
