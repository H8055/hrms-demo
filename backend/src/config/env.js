import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/hrms',
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || 'no-reply@hrms.local',
  authRateLimitWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX || 100),
  // Document storage: 'local' | 'supabase' | 'spaces'
  storageProvider: process.env.STORAGE_PROVIDER || 'local',
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
    bucket: process.env.SUPABASE_BUCKET || 'employee-documents',
    // seconds a signed download URL stays valid
    signedUrlTtl: Number(process.env.SUPABASE_SIGNED_URL_TTL || 300)
  },
  spaces: {
    endpoint: process.env.SPACES_ENDPOINT || '',
    region: process.env.SPACES_REGION || '',
    bucket: process.env.SPACES_BUCKET || '',
    key: process.env.SPACES_KEY || '',
    secret: process.env.SPACES_SECRET || '',
    signedUrlTtl: Number(process.env.SPACES_SIGNED_URL_TTL || 300)
  }
};
