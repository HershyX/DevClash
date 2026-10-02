import rateLimit from 'express-rate-limit';

/** Strict limiter for login / register / demo-login endpoints. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: 'Too many attempts, try again in 15 minutes' },
});

/** General API limiter — generous, protects against runaway clients. */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: 'Rate limit exceeded' },
});
