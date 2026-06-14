import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDb() {
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 20,
    autoIndex: env.nodeEnv !== 'production'
  });
  console.log('MongoDB connected');
}

export async function isDbReady() {
  if (mongoose.connection.readyState !== 1) {
    return false;
  }

  try {
    await mongoose.connection.db.admin().ping();
    return true;
  } catch {
    return false;
  }
}
