import mongoose from 'mongoose';

const classroomSettingsSchema = new mongoose.Schema(
  {
    allowDuel: { type: Boolean, default: true },
    allowPractice: { type: Boolean, default: true },
    allowAdaptive: { type: Boolean, default: true },
    visibility: { type: String, enum: ['private', 'public'], default: 'private' },
  },
  { _id: false }
);

const classroomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    subject: { type: String, default: '' },
    section: { type: String, default: '' },
    description: { type: String, default: '' },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    settings: { type: classroomSettingsSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true },
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

const Classroom = mongoose.model('Classroom', classroomSchema);
// Compound index: teacher's active classrooms — common query pattern
// (already indexed on teacher alone; add isActive compound for filtered queries)

export default Classroom;
