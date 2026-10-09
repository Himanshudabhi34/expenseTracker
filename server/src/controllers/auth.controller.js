import * as authService from '../services/auth.service.js';
import { sendSuccess } from '../middleware/errorHandler.js';
import { setAuthCookie, clearAuthCookie, signToken } from '../middleware/authenticate.js';
import asyncHandler from '../utils/asyncHandler.js';

export const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);
  const token = signToken({ _id: user.id });
  setAuthCookie(res, token);
  sendSuccess(res, { user, token }, 201);
});

export const login = asyncHandler(async (req, res) => {
  const user = await authService.authenticateUser(req.body);
  const token = signToken(user);
  setAuthCookie(res, token);
  sendSuccess(res, { user: user.toJSON(), token });
});

export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  sendSuccess(res, { message: 'Logged out' });
});

export const me = asyncHandler(async (req, res) => {
  sendSuccess(res, { user: req.user.toJSON() });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user._id, req.body);
  sendSuccess(res, { user });
});

export default { register, login, logout, me, updateProfile };
