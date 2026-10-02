/**
 * Classroom Authorization Tests
 * ────────────────────────────────────────────────────────────────────────────
 * Teachers should only access their own classrooms and their own students.
 * Students should only be able to join with a valid code.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import Classroom from '../src/models/Classroom.js';
import ClassroomMembership from '../src/models/ClassroomMembership.js';
import * as classroomService from '../src/services/classroomService.js';

beforeAll(async () => { await connectDB(); });
afterAll(async ()  => { await disconnectDB(); });

async function getUser(email) {
  const u = await User.findOne({ email });
  if (!u) throw new Error(`User not found: ${email}`);
  return u;
}

describe('Classroom Authorization', () => {

  let createdClassroomId;

  describe('Teacher creates and owns classrooms', () => {
    it('teacher can create a classroom', async () => {
      const teacher = await getUser('teacher@devclash.demo');
      const cls = await classroomService.createClassroom(
        { name: 'Auth Test Class', description: 'Testing auth' },
        teacher
      );
      expect(cls.id).toBeTruthy();
      expect(cls.code).toMatch(/^[A-Z0-9-]+$/);
      createdClassroomId = cls.id;
    });

    it('teacher can retrieve their own classroom', async () => {
      const teacher = await getUser('teacher@devclash.demo');
      const cls = await classroomService.getClassroom(createdClassroomId, teacher._id.toString());
      expect(cls.id).toBe(createdClassroomId);
    });

    it('different teacher cannot retrieve another teacher classroom', async () => {
      // Use a student as a stand-in for "another teacher" — same check
      const stranger = await getUser('student@devclash.demo');
      await expect(
        classroomService.getClassroom(createdClassroomId, stranger._id.toString())
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('listAllStudents returns empty for a non-teacher user', async () => {
      const student = await getUser('student@devclash.demo');
      const list    = await classroomService.listAllStudents(student._id.toString());
      expect(Array.isArray(list)).toBe(true);
      // Student owns no classrooms, so result should be empty
      expect(list.length).toBe(0);
    });
  });

  describe('Student joins by code', () => {
    it('student can join using the classroom code', async () => {
      const teacher = await getUser('teacher@devclash.demo');
      const cls     = await classroomService.getClassroom(createdClassroomId, teacher._id.toString());
      const student = await getUser('david@student.devclash.demo');

      const result = await classroomService.joinByCode(cls.code, student);
      expect(result.classroomId).toBe(createdClassroomId);
    });

    it('rejects joining with an invalid code', async () => {
      const student = await getUser('david@student.devclash.demo');
      await expect(
        classroomService.joinByCode('INVALID-CODE', student)
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('rejects duplicate membership', async () => {
      const teacher = await getUser('teacher@devclash.demo');
      const cls     = await classroomService.getClassroom(createdClassroomId, teacher._id.toString());
      const student = await getUser('david@student.devclash.demo');

      await expect(
        classroomService.joinByCode(cls.code, student)
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('teacher cannot join as a student', async () => {
      const teacher = await getUser('teacher@devclash.demo');
      const cls     = await classroomService.getClassroom(createdClassroomId, teacher._id.toString());
      await expect(
        classroomService.joinByCode(cls.code, teacher)
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe('Teacher sees correct student data', () => {
    it('teacher can see students in their own classroom', async () => {
      const teacher = await getUser('teacher@devclash.demo');
      const cls     = await classroomService.getClassroom(createdClassroomId, teacher._id.toString());
      expect(Array.isArray(cls.students)).toBe(true);
      // David should now be a member
      const davidFound = cls.students.some((s) => s.email === 'david@student.devclash.demo');
      expect(davidFound).toBe(true);
    });

    it('each student entry exposes three independent ratings', async () => {
      const teacher = await getUser('teacher@devclash.demo');
      const cls     = await classroomService.getClassroom(createdClassroomId, teacher._id.toString());
      for (const student of cls.students) {
        expect(typeof student.duelRating).toBe('number');
        expect(typeof student.practiceRating).toBe('number');
        expect(typeof student.adaptiveRating).toBe('number');
        // Passwords must never appear
        expect(student.passwordHash).toBeUndefined();
      }
    });
  });

  // Cleanup
  afterAll(async () => {
    if (createdClassroomId) {
      await ClassroomMembership.deleteMany({ classroom: createdClassroomId });
      await Classroom.deleteOne({ _id: createdClassroomId });
    }
  });
});
