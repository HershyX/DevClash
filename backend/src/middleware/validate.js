import { body } from 'express-validator';

const emailRule = body('email').isEmail().withMessage('Valid email required').normalizeEmail();

const passwordRule = body('password')
  .isString()
  .isLength({ min: 6, max: 128 })
  .withMessage('Password must be 6-128 characters');

export const registerRules = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
  emailRule,
  passwordRule,
  body('role')
    .isIn(['student', 'teacher', 'personal'])
    .withMessage('Role must be student, teacher, or personal'),
];

export const loginRules = [emailRule, passwordRule];

export const classroomRules = [
  body('name').trim().isLength({ min: 3, max: 120 }).withMessage('Name must be 3-120 characters'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('subject').optional().trim().isLength({ max: 80 }),
  body('section').optional().trim().isLength({ max: 80 }),
];

export const problemRules = [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description is required'),
  body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty'),
  body('tags').optional().isArray(),
  body('testCases').optional().isArray(),
];
