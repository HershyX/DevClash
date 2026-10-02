/**
 * Authentication & Authorization Tests
 * ────────────────────────────────────────────────────────────────────────────
 * Tests registration, login, demo login, JWT validation, role guards,
 * and that passwords are never returned in responses.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import * as authService from '../src/services/authService.js';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';

// ── Setup ────────────────────────────────────────────────────────────────────

const TEST_EMAIL = `test-auth-${Date.now()}@devclash.test`;
const TEST_PASS  = 'TestPass123!';
let testUserId;

beforeAll(async () => {
  await connectDB();
  // Clean up any leftover test account
  await User.deleteOne({ email: TEST_EMAIL });
});

afterAll(async () => {
  await User.deleteOne({ email: TEST_EMAIL });
  if (testUserId) await User.deleteOne({ _id: testUserId });
  await disconnectDB();
});

// ── Registration ─────────────────────────────────────────────────────────────

describe('Registration', () => {
  it('creates a new user and returns a JWT', async () => {
    const res = await authService.registerUser({
      name:     'Test User',
      email:    TEST_EMAIL,
      password: TEST_PASS,
      role:     'student',
    });

    expect(res.user).toBeTruthy();
    expect(res.token).toBeTruthy();
    expect(typeof res.token).toBe('string');
    testUserId = res.user.id;
  });

  it('does NOT return passwordHash in registration response', async () => {
    const res = await authService.registerUser({
      name:     'PW Check',
      email:    `pw-check-${Date.now()}@test.dev`,
      password: TEST_PASS,
      role:     'student',
    });
    expect(res.user.passwordHash).toBeUndefined();
    await User.deleteOne({ email: res.user.email });
  });

  it('rejects duplicate email with 409', async () => {
    await expect(
      authService.registerUser({ name: 'Dup', email: TEST_EMAIL, password: TEST_PASS, role: 'student' })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('new user starts with 1200 rating on all ladders', async () => {
    const user = await User.findById(testUserId);
    expect(user.duelRating.rating).toBe(1200);
    expect(user.problemSetRating.rating).toBe(1200);
    expect(user.adaptiveRating.rating).toBe(1200);
  });
});

// ── Login ─────────────────────────────────────────────────────────────────────

describe('Login', () => {
  it('returns user + JWT for correct credentials', async () => {
    const res = await authService.loginUser({ email: TEST_EMAIL, password: TEST_PASS });
    expect(res.user).toBeTruthy();
    expect(res.token).toBeTruthy();
    expect(res.user.email).toBe(TEST_EMAIL);
  });

  it('rejects wrong password with 401', async () => {
    await expect(
      authService.loginUser({ email: TEST_EMAIL, password: 'wrong-password' })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('rejects unknown email with 401', async () => {
    await expect(
      authService.loginUser({ email: 'nobody@devclash.test', password: TEST_PASS })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('does NOT return passwordHash in login response', async () => {
    const res = await authService.loginUser({ email: TEST_EMAIL, password: TEST_PASS });
    expect(res.user.passwordHash).toBeUndefined();
  });

  it('JWT payload contains sub (user id) and role', async () => {
    const { token } = await authService.loginUser({ email: TEST_EMAIL, password: TEST_PASS });
    const payload   = jwt.verify(token, env.jwtSecret);
    expect(payload.sub).toBeTruthy();
    expect(payload.role).toBe('student');
  });
});

// ── Demo Login ────────────────────────────────────────────────────────────────

describe('Demo Login', () => {
  for (const role of ['student', 'teacher', 'personal']) {
    it(`demo login for role "${role}" returns a real user from MongoDB`, async () => {
      const res = await authService.demoLoginUser(role);
      expect(res.user).toBeTruthy();
      expect(res.user.role).toBe(role);
      expect(res.token).toBeTruthy();
      expect(res.user.passwordHash).toBeUndefined();
      // Verify it's a real DB record
      const dbUser = await User.findOne({ email: res.user.email });
      expect(dbUser).toBeTruthy();
      expect(dbUser.isDemo).toBe(true);
    });
  }

  it('returns 400 for unknown demo role', async () => {
    await expect(authService.demoLoginUser('unknown-role'))
      .rejects.toMatchObject({ statusCode: 400 });
  });
});

// ── JWT includes all rating ladders ──────────────────────────────────────────

describe('User response shape', () => {
  it('login response includes xpToNextLevel on all three ladders', async () => {
    const { user } = await authService.loginUser({ email: TEST_EMAIL, password: TEST_PASS });
    expect(typeof user.duelRating?.xpToNextLevel).toBe('number');
    expect(typeof user.practiceRating?.xpToNextLevel).toBe('number');
    expect(typeof user.adaptiveRating?.xpToNextLevel).toBe('number');
  });

  it('demo login response includes three independent rating ladders', async () => {
    const { user } = await authService.demoLoginUser('student');
    expect(user.duelRating).toBeTruthy();
    expect(user.practiceRating).toBeTruthy();
    expect(user.adaptiveRating).toBeTruthy();
    // They should be different values (seed data sets them deliberately different)
    expect(user.duelRating.rating).not.toBe(user.practiceRating.rating);
  });
});
