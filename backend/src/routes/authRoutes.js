import { Router } from 'express';
import { register, login, demoLogin, logout, me } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { registerRules, loginRules } from '../middleware/validate.js';
import { validationRun } from '../utils/validateRun.js';

const router = Router();

router.post('/register', authLimiter, validationRun(registerRules), register);
router.post('/login', authLimiter, validationRun(loginRules), login);
router.post('/demo-login', authLimiter, demoLogin);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, me);

export default router;
