import { asyncHandler } from '../utils/asyncHandler.js';
import * as classroomService from '../services/classroomService.js';

/** GET /api/classrooms (teacher: own classrooms) */
export const list = asyncHandler(async (req, res) => {
  const classrooms = await classroomService.listClassrooms(req.user._id.toString());
  res.json({ success: true, data: classrooms });
});

/** GET /api/classrooms/:id */
export const get = asyncHandler(async (req, res) => {
  const classroom = await classroomService.getClassroom(req.params.id, req.user._id.toString());
  res.json({ success: true, data: classroom });
});

/** POST /api/classrooms (teacher) */
export const create = asyncHandler(async (req, res) => {
  const classroom = await classroomService.createClassroom(req.body, req.user);
  res.status(201).json({ success: true, message: 'Classroom created', data: classroom });
});

/** PUT /api/classrooms/:id (teacher) */
export const update = asyncHandler(async (req, res) => {
  const classroom = await classroomService.updateClassroom(req.params.id, req.body, req.user._id.toString());
  res.json({ success: true, message: 'Classroom updated', data: classroom });
});

/** DELETE /api/classrooms/:id (teacher) */
export const remove = asyncHandler(async (req, res) => {
  await classroomService.deleteClassroom(req.params.id, req.user._id.toString());
  res.status(204).send();
});

/** POST /api/classrooms/:id/students (teacher adds by email) */
export const addStudent = asyncHandler(async (req, res) => {
  const classroom = await classroomService.addStudent(req.params.id, req.body.email, req.user._id.toString());
  res.json({ success: true, message: 'Student added', data: classroom });
});

/** DELETE /api/classrooms/:id/students/:studentId (teacher) */
export const removeStudent = asyncHandler(async (req, res) => {
  const classroom = await classroomService.removeStudent(req.params.id, req.params.studentId, req.user._id.toString());
  res.json({ success: true, message: 'Student removed', data: classroom });
});

/** PUT /api/classrooms/:id/settings (teacher) */
export const updateSettings = asyncHandler(async (req, res) => {
  const classroom = await classroomService.updateSettings(req.params.id, req.body, req.user._id.toString());
  res.json({ success: true, message: 'Settings updated', data: classroom });
});

/** GET /api/classrooms/:id/analytics (teacher) */
export const analytics = asyncHandler(async (req, res) => {
  const data = await classroomService.getClassroomAnalytics(req.params.id);
  res.json({ success: true, data });
});

/** GET /api/classrooms/:id/students/:studentId (teacher) */
export const studentDetail = asyncHandler(async (req, res) => {
  const data = await classroomService.getStudentDetail(req.params.id, req.params.studentId, req.user._id.toString());
  res.json({ success: true, data });
});

/** GET /api/classrooms/students — all students across all teacher classrooms */
export const listAllStudents = asyncHandler(async (req, res) => {
  const data = await classroomService.listAllStudents(req.user._id.toString());
  res.json({ success: true, data });
});

/** POST /api/classrooms/join (student joins by code) */
export const joinByCode = asyncHandler(async (req, res) => {
  const result = await classroomService.joinByCode(req.body.code, req.user);
  res.json({ success: true, message: 'Joined classroom', data: result });
});
