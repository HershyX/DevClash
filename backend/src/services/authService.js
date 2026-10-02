import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { ApiError } from '../middleware/errorHandler.js';
import { mapUserToClient } from './userMapper.js';

const SALT_ROUNDS = 10;

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

function toPublicUser(user) {
  return mapUserToClient(user);
}

export async function registerUser({ name, email, password, role }) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email, passwordHash, role });
  return { user: toPublicUser(user), token: signToken(user) };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) {
    throw new ApiError(401, 'Invalid email or password');
  }

  return { user: toPublicUser(user), token: signToken(user) };
}

const DEMO_EMAILS = {
  student: 'student@devclash.demo',
  teacher: 'teacher@devclash.demo',
  personal: 'personal@devclash.demo',
};

export async function demoLoginUser(role) {
  const email = DEMO_EMAILS[role];
  if (!email) {
    throw new ApiError(400, `Unknown demo role: ${role}`);
  }

  const user = await User.findOne({ email, isDemo: true });
  if (!user) {
    throw new ApiError(503, 'Demo accounts not seeded yet. Run: npm run seed (in backend/)');
  }

  return { user: toPublicUser(user), token: signToken(user) };
}
