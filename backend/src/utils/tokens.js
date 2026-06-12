import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email },
    env.accessTokenSecret,
    { expiresIn: env.accessTokenTtl }
  );
}

export function signRefreshToken(user) {
  return jwt.sign({ sub: user._id.toString() }, env.refreshTokenSecret, {
    expiresIn: env.refreshTokenTtl
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.accessTokenSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.refreshTokenSecret);
}

export function refreshCookieOptions() {
  const secure = env.nodeEnv === 'production';

  return {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
}
