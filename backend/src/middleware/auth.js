import { User } from '../models/User.js';
import { verifyAccessToken } from '../utils/tokens.js';
import { canUserPerform } from '../services/permission.service.js';

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select('-passwordHash -refreshToken -resetTokenHash');

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }

    next();
  };
}

export function checkPermission(moduleKey, action = 'view') {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const allowed = await canUserPerform(req.user, moduleKey, action);
    if (!allowed) {
      return res.status(403).json({ message: `Missing permission: ${moduleKey}.${action}` });
    }

    next();
  };
}
