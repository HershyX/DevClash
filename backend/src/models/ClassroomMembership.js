import mongoose from 'mongoose';

const classroomMembershipSchema = new mongoose.Schema(
  {
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['student', 'teacher'], default: 'student' },
    status: { type: String, enum: ['active', 'invited', 'removed'], default: 'active' },
    joinedAt: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

classroomMembershipSchema.index({ classroom: 1, user: 1 }, { unique: true });

const ClassroomMembership = mongoose.model('ClassroomMembership', classroomMembershipSchema);

export default ClassroomMembership;
