import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';

/**
 * Extracts the Bearer token from the Authorization header.
 */
function extractToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null;
}

export async function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    let payload;
    try {
      payload = jwt.verify(token, env.jwtSecret);
    } catch (err) {
      const message =
        err.name === 'TokenExpiredError' ? 'Session expired, please log in again' : 'Invalid token';
      return res.status(401).json({ success: false, error: message });
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User no longer exists' });
    }

    req.user = user; // full mongoose doc; toJSON strips passwordHash
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Express middleware factory. Usage: requireRole('teacher'), requireRole('student', 'personal').
 * Must run after requireAuth.
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied: requires ${roles.join(' or ')} role`,
      });
    }
    return next();
  };
}
