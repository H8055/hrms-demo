# HRMS Deployment Runbook

## 1. Minimum environment variables

### Backend
- `PORT`
- `NODE_ENV`
- `MONGO_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `ACCESS_TOKEN_TTL`
- `REFRESH_TOKEN_TTL`
- `FRONTEND_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `AUTH_RATE_LIMIT_WINDOW_MS`
- `AUTH_RATE_LIMIT_MAX`

### Frontend
- `VITE_API_URL`

## 2. Recommended production startup

```bash
npm install
npm run build -w frontend
npm run test -w backend
npm run seed -w backend   # only for fresh demo / first-time environment
npm run start -w backend
```

## 3. Health verification

### Liveness
- `GET /api/health`

### Readiness
- `GET /api/health/ready`

Readiness should return HTTP `200` when MongoDB is reachable.

## 4. Post-deploy smoke checks
- Open `/api/docs`
- Login with a valid user
- Verify Dashboard loads
- Verify Notifications load
- Verify Permissions page loads for allowed role
- Upload one employee document
- Run one attendance export
- Run one advance request flow

## 5. Recovery basics
- If API is up but `/api/health/ready` returns 503, inspect MongoDB connectivity first.
- If uploads fail, verify file system permissions for `backend/uploads`.
- If auth fails widely, verify JWT secrets and refresh-cookie frontend origin configuration.

## 6. Recommended next hardening
- move uploads to cloud object storage
- add structured logging
- add error tracking
- add database backup policy
- add CI quality gates for integration and E2E tests
