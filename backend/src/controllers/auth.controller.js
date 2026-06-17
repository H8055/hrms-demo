import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  refreshCookieOptions,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from '../utils/tokens.js';
import { sendMail } from '../services/mail.service.js';
import { getEffectivePermissionsForUser } from '../services/permission.service.js';
import { getDefaultRoleKey, roleExists } from '../services/role.service.js';

function validationErrorResult(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    return true;
  }
  return false;
}

async function serializeAuthUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    designation: user.designation,
    employeeCode: user.employeeCode,
    phone: user.phone,
    joiningDate: user.joiningDate,
    employmentStatus: user.employmentStatus,
    leaveBalances: user.leaveBalances,
    isActive: user.isActive,
    createdAt: user.createdAt,
    permissions: await getEffectivePermissionsForUser(user)
  };
}

export const register = asyncHandler(async (req, res) => {
  if (validationErrorResult(req, res)) return;

  const { name, email, password, role } = req.body;
  const usersCount = await User.countDocuments();
  const requester = req.user || null;

  if (usersCount > 0 && (!requester || requester.role !== 'admin')) {
    return res.status(403).json({ message: 'Only admins can create additional users' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: 'Email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const fallbackRole = await getDefaultRoleKey();
  const assignedRole = usersCount === 0 ? 'admin' : (role || fallbackRole);

  if (!(await roleExists(assignedRole))) {
    return res.status(400).json({ message: 'Selected role does not exist or is inactive' });
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: assignedRole
  });

  return res.status(201).json({
    message: usersCount === 0 ? 'First admin account created successfully' : 'User created successfully',
    user: await serializeAuthUser(user)
  });
});

export const login = asyncHandler(async (req, res) => {
  if (validationErrorResult(req, res)) return;

  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user || !user.isActive) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie('refreshToken', refreshToken, refreshCookieOptions());
  return res.json({
    message: 'Login successful',
    accessToken,
    user: await serializeAuthUser(user)
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    return res.status(401).json({ message: 'Refresh token missing' });
  }

  const payload = verifyRefreshToken(token);
  const user = await User.findById(payload.sub);

  if (!user || !user.isActive || user.refreshToken !== token) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }

  const accessToken = signAccessToken(user);
  return res.json({ accessToken, user: await serializeAuthUser(user) });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (token) {
    const user = await User.findOne({ refreshToken: token });
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
  }

  res.clearCookie('refreshToken', refreshCookieOptions());
  return res.json({ message: 'Logged out successfully' });
});

export const me = asyncHandler(async (req, res) => {
  return res.json({ user: await serializeAuthUser(req.user) });
});

export const changePassword = asyncHandler(async (req, res) => {
  if (validationErrorResult(req, res)) return;

  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);

  const matches = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!matches) {
    return res.status(400).json({ message: 'Current password is incorrect' });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.refreshToken = null;
  await user.save();

  res.clearCookie('refreshToken', refreshCookieOptions());
  return res.json({ message: 'Password changed successfully. Please log in again.' });
});

export const bootstrapStatus = asyncHandler(async (req, res) => {
  const usersCount = await User.countDocuments();
  return res.json({
    hasUsers: usersCount > 0,
    requiresSetup: usersCount === 0,
    usersCount
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  if (validationErrorResult(req, res)) return;

  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return res.json({ message: 'If that email exists, a reset link has been sent' });
  }

  const token = crypto.randomBytes(24).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  user.resetTokenHash = tokenHash;
  user.resetTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 30);
  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  await sendMail({
    to: user.email,
    subject: 'Reset your HRMS password',
    text: `Reset your password using this link: ${resetUrl}`,
    html: `<p>Reset your password using this link:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
  });

  return res.json({
    message: 'If that email exists, a reset link has been sent',
    previewToken: process.env.NODE_ENV === 'development' ? token : undefined
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  if (validationErrorResult(req, res)) return;

  const { token, password } = req.body;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetTokenHash: tokenHash,
    resetTokenExpiresAt: { $gt: new Date() }
  });

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired reset token' });
  }

  user.passwordHash = await bcrypt.hash(password, 10);
  user.resetTokenHash = null;
  user.resetTokenExpiresAt = null;
  user.refreshToken = null;
  await user.save();

  res.clearCookie('refreshToken', refreshCookieOptions());
  return res.json({ message: 'Password reset successful' });
});
