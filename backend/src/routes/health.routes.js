import { Router } from 'express';
import os from 'os';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { isDbReady } from '../config/db.js';

const router = Router();
const startedAt = Date.now();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'hrms-api',
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    hostname: os.hostname(),
    mongoState: mongoose.connection.readyState
  });
});

router.get('/ready', async (req, res) => {
  const dbReady = await isDbReady();
  const ready = dbReady;

  return res.status(ready ? 200 : 503).json({
    ready,
    database: dbReady ? 'connected' : 'not-ready',
    timestamp: new Date().toISOString()
  });
});

export default router;
