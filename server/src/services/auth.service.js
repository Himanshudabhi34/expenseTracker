import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';

export async function registerUser({ name, email, password, currency, timezone }) {
  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, passwordHash, currency, timezone });
  return user.toJSON();
}

export async function authenticateUser({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const valid = await user.verifyPassword(password);
  if (!valid) throw ApiError.unauthorized('Invalid email or password');

  return user;
}

export async function getProfile(userId) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  return user.toJSON();
}

export async function updateProfile(userId, payload) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw ApiError.notFound('User not found');

  if (payload.name !== undefined) user.name = payload.name;
  if (payload.currency !== undefined) user.currency = payload.currency;
  if (payload.timezone !== undefined) user.timezone = payload.timezone;

  if (payload.newPassword) {
    const ok = await user.verifyPassword(payload.currentPassword || '');
    if (!ok) throw ApiError.badRequest('Current password is incorrect');
    user.passwordHash = await User.hashPassword(payload.newPassword);
  }

  await user.save();
  return user.toJSON();
}

export default { registerUser, authenticateUser, getProfile, updateProfile };
