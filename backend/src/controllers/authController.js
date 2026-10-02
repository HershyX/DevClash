import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/authService.js';
import { mapUserToClient } from '../services/userMapper.js';

/** POST /api/auth/register */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const result = await authService.registerUser({ name, email, password, role });
  res.status(201).json({ success: true, message: 'Registration successful', data: result });
});

/** POST /api/auth/login */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.loginUser({ email, password });
  res.json({ success: true, message: 'Login successful', data: result });
});

/** POST /api/auth/demo-login */
export const demoLogin = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const result = await authService.demoLoginUser(role);
  res.json({ success: true, message: 'Demo login successful', data: result });
});

/** POST /api/auth/logout */
export const logout = asyncHandler(async (req, res) => {
  // JWT is stateless; the client drops the token.
  res.json({ success: true, message: 'Logged out' });
});

/** GET /api/auth/me */
export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: mapUserToClient(req.user) } });
});
