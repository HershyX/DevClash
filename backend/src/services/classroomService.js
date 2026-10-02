import Classroom from '../models/Classroom.js';
import ClassroomMembership from '../models/ClassroomMembership.js';
import User from '../models/User.js';
import { ApiError } from '../middleware/errorHandler.js';
import { getRecentActivity } from './activityService.js';
import { getXPToNextLevel } from '../utils/ladder.js';

function classroomToClient(doc, { includeStudents = false } = {}) {
  const c = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const id = c._id.toString();

  const base = {
    id,
    name: c.name,
    code: c.code,
    subject: c.subject ?? '',
    section: c.section ?? '',
    description: c.description ?? '',
    teacherId: c.teacher?._id?.toString?.() ?? c.teacher?.toString?.() ?? c.teacher,
    isActive: c.isActive,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    settings: c.settings ?? { allowDuel: true, allowPractice: true, allowAdaptive: true, visibility: 'private' },
  };

  if (includeStudents && Array.isArray(c.members)) {
    base.students = c.members.map((m) => studentToClient(m.user, m));
    base.studentCount = c.members.length;
  }
  return base;
}

function studentToClient(user, membership) {
  const u = typeof user.toObject === 'function' ? user.toObject() : user;
  return {
    userId: u._id.toString(),
    name: u.name,
    email: u.email,
    joinedAt: membership?.joinedAt ?? u.createdAt,
    duelRating: u.duelRating?.rating ?? 1200,
    practiceRating: u.problemSetRating?.rating ?? 1200,
    adaptiveRating: u.adaptiveRating?.rating ?? 1200,
    problemsSolved: u.statistics?.problemsSolved ?? 0,
    battles: u.statistics?.totalBattles ?? 0,
    accuracy: u.statistics?.winRate ?? 0,
    isActive: membership ? membership.status === 'active' : true,
    lastActive: membership?.lastActive ?? u.updatedAt ?? u.createdAt,
  };
}

async function assertOwned(classroomId, teacherId) {
  const classroom = await Classroom.findOne({ _id: classroomId, teacher: teacherId });
  if (!classroom) throw new ApiError(404, 'Classroom not found');
  return classroom;
}

export async function listClassrooms(teacherId) {
  const classrooms = await Classroom.find({ teacher: teacherId }).sort({ createdAt: -1 }).lean();
  const counts = await ClassroomMembership.aggregate([
    { $match: { classroom: { $in: classrooms.map((c) => c._id) }, status: 'active' } },
    { $group: { _id: '$classroom', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));
  return classrooms.map((c) => ({ ...classroomToClient(c), studentCount: countMap[c._id.toString()] ?? 0 }));
}

export async function getClassroom(id, teacherId) {
  await assertOwned(id, teacherId);
  const classroom = await Classroom.findById(id).lean();
  const members = await ClassroomMembership.find({ classroom: id, status: 'active' })
    .populate('user')
    .sort({ joinedAt: 1 })
    .lean();

  const result = classroomToClient(classroom, { includeStudents: true });
  result.students = members.map((m) => studentToClient(m.user, m));
  result.studentCount = result.students.length;
  return result;
}

export async function createClassroom(data, teacher) {
  const code = await generateUniqueCode(data.name);
  const classroom = await Classroom.create({
    name: data.name,
    description: data.description ?? '',
    subject: data.subject ?? '',
    section: data.section ?? '',
    code,
    teacher: teacher._id,
  });
  await ClassroomMembership.create({
    classroom: classroom._id,
    user: teacher._id,
    role: 'teacher',
    status: 'active',
  });
  return classroomToClient(classroom);
}

async function generateUniqueCode(name) {
  const prefix =
    (name.split(/\s+/).map((w) => w[0]).join('').toUpperCase() || 'CLS').slice(0, 4) +
    '-' +
    new Date().getFullYear().toString().slice(-2);
  for (let i = 0; i < 10; i++) {
    const code = `${prefix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    if (!(await Classroom.findOne({ code }))) return code;
  }
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

export async function updateClassroom(id, data, teacherId) {
  const classroom = await assertOwned(id, teacherId);
  Object.assign(classroom, data);
  await classroom.save();
  return classroomToClient(classroom);
}

export async function deleteClassroom(id, teacherId) {
  const classroom = await assertOwned(id, teacherId);
  await classroom.deleteOne();
  await ClassroomMembership.deleteMany({ classroom: id });
}

export async function addStudent(classroomId, email, teacherId) {
  await assertOwned(classroomId, teacherId);

  const student = await User.findOne({ email: email.toLowerCase() });
  if (!student) throw new ApiError(404, `No user found with email ${email}`);
  if (student.role !== 'student') throw new ApiError(400, 'Only student accounts can be added to classrooms');

  const existing = await ClassroomMembership.findOne({ classroom: classroomId, user: student._id });
  if (existing) {
    if (existing.status === 'active') throw new ApiError(409, 'Student is already in this classroom');
    existing.status = 'active';
    await existing.save();
  } else {
    await ClassroomMembership.create({ classroom: classroomId, user: student._id, role: 'student', status: 'active' });
  }

  return getClassroom(classroomId, teacherId);
}

export async function removeStudent(classroomId, studentId, teacherId) {
  await assertOwned(classroomId, teacherId);
  await ClassroomMembership.updateOne(
    { classroom: classroomId, user: studentId },
    { status: 'removed' }
  );
  return getClassroom(classroomId, teacherId);
}

export async function updateSettings(id, settings, teacherId) {
  const classroom = await assertOwned(id, teacherId);
  classroom.settings = { ...classroom.settings?.toObject?.(), ...settings };
  await classroom.save();
  return classroomToClient(classroom);
}

export async function joinByCode(code, user) {
  const classroom = await Classroom.findOne({ code: code.trim().toUpperCase(), isActive: true });
  if (!classroom) throw new ApiError(404, `No classroom found with code "${code}"`);
  if (user.role !== 'student') throw new ApiError(403, 'Only students can join classrooms');

  const existing = await ClassroomMembership.findOne({ classroom: classroom._id, user: user._id });
  if (existing?.status === 'active') throw new ApiError(409, 'You have already joined this classroom');

  if (existing) {
    existing.status = 'active';
    await existing.save();
  } else {
    await ClassroomMembership.create({ classroom: classroom._id, user: user._id, role: 'student', status: 'active' });
  }

  return { classroomId: classroom._id.toString(), name: classroom.name, code: classroom.code };
}

export async function getStudentDetail(classroomId, studentId, teacherId) {
  const classroom = await assertOwned(classroomId, teacherId);
  const membership = await ClassroomMembership.findOne({ classroom: classroomId, user: studentId, status: 'active' }).populate('user');
  if (!membership) throw new ApiError(404, 'Student not found in this classroom');

  const student = studentToClient(membership.user, membership);
  const stats = membership.user.statistics ?? {};

  const duelHistory = await RatingHistory(studentId, 'duel', 12);
  const problemSetHistory = await RatingHistory(studentId, 'problemSet', 12);
  const adaptiveHistory = await RatingHistory(studentId, 'adaptive', 12);

  return {
    student,
    statistics: {
      totalBattles: stats.totalBattles ?? 0,
      winRate: stats.winRate ?? 0,
      problemsSolved: stats.problemsSolved ?? 0,
      adaptiveSessions: stats.adaptiveSessions ?? 0,
      currentStreak: stats.currentStreak ?? 0,
      ratingHistory: duelHistory.map((d, i) => ({
        date: d.date,
        duel: d.rating,
        practice: problemSetHistory[i]?.rating ?? student.practiceRating,
        adaptive: adaptiveHistory[i]?.rating ?? student.adaptiveRating,
      })),
    },
  };
}

/**
 * Returns all students across all of a teacher's classrooms in a single call.
 * Each student entry includes the classroom name so the UI can group/filter.
 */
export async function listAllStudents(teacherId) {
  const classrooms = await Classroom.find({ teacher: teacherId }).lean();
  if (classrooms.length === 0) return [];

  const classroomIds = classrooms.map((c) => c._id);
  const classroomMap = Object.fromEntries(classrooms.map((c) => [c._id.toString(), c.name]));

  const memberships = await ClassroomMembership.find({
    classroom: { $in: classroomIds },
    role: 'student',
    status: 'active',
  })
    .populate('user')
    .lean();

  // Deduplicate: a student in two classrooms appears once per classroom
  return memberships
    .filter((m) => m.user)
    .map((m) => ({
      ...studentToClient(m.user, m),
      classroom:   classroomMap[m.classroom.toString()] ?? '',
      classroomId: m.classroom.toString(),
    }));
}

async function RatingHistory(userId, ladder, limit) {
  const Rating = (await import('../models/Rating.js')).default;
  const entries = await Rating.find({ user: userId, ladder }).sort({ createdAt: 1 }).limit(limit).lean();
  return entries.map((e) => ({
    date: e.createdAt.toISOString().split('T')[0],
    rating: e.ratingAfter,
  }));
}
