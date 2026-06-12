import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'hrms-api', timestamp: new Date().toISOString() });
});

export default router;
