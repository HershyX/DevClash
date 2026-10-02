import { Router } from 'express';
import { list, get, create, update, remove, addStudent, removeStudent, updateSettings, analytics, studentDetail, joinByCode, listAllStudents } from '../controllers/classroomController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { classroomRules } from '../middleware/validate.js';
import { validationRun } from '../utils/validateRun.js';

const router = Router();

router.use(requireAuth);

// Student join-by-code
router.post('/join', requireRole('student'), joinByCode);

// All students across teacher's classrooms (single call for StudentsPage)
router.get('/students', requireRole('teacher'), listAllStudents);

// Teacher management
router.get('/', requireRole('teacher'), list);
router.post('/', requireRole('teacher'), validationRun(classroomRules), create);
router.get('/:id', requireRole('teacher'), get);
router.put('/:id', requireRole('teacher'), update);
router.delete('/:id', requireRole('teacher'), remove);
router.post('/:id/students', requireRole('teacher'), addStudent);
router.delete('/:id/students/:studentId', requireRole('teacher'), removeStudent);
router.put('/:id/settings', requireRole('teacher'), updateSettings);
router.get('/:id/analytics', requireRole('teacher'), analytics);
router.get('/:id/students/:studentId', requireRole('teacher'), studentDetail);

export default router;
