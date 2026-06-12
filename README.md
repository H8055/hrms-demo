# HRMS Responsive MERN

A mobile-first, web-responsive HRMS application built from your sprint plan PDF and extended across all sprint areas at MVP level.

## Implemented modules

- Authentication with JWT + refresh cookie flow
- Forgot password + reset password screens
- Responsive dashboard shell + error boundary + 404 page
- Employee management
- Attendance with regularization flow
- Leave management with approval flow
- Advance request priority workflow
- Payroll structures, payroll runs, and paid status
- Performance reviews
- Reports overview
- Company settings
- Notifications + audit logs
- Swagger API docs
- PWA manifest + service worker scaffold
- Backend smoke tests
- GitHub Actions CI scaffold

## Project structure

```text
hrms-responsive/
  backend/
  frontend/
  preview/
  .github/workflows/
```

## Responsive targets

The UI is structured for:

- 375px mobile
- 768px tablet
- 1280px desktop

## Quick start

### 1) Install

```bash
npm install
```

### 2) Configure env files

Create:

- `backend/.env`
- `frontend/.env`

Use the example files:

- `backend/.env.example`
- `frontend/.env.example`

### 3) Start MongoDB

```bash
docker compose up -d mongo
```

### 4) Seed demo data

```bash
npm run seed -w backend
```

### 5) Run the app

```bash
npm run dev
```

## Useful URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Swagger docs: `http://localhost:5000/api/docs`
- Health: `http://localhost:5000/api/health`

## Demo users after seed

- `admin@example.com / Password@123`
- `hr@example.com / Password@123`
- `manager@example.com / Password@123`
- `employee@example.com / Password@123`

## Helpful scripts

```bash
npm run dev
npm run build -w frontend
npm run test -w backend
npm run seed -w backend
```

## Current project notes

- Advance Request remains the most complete module.
- Email falls back to console preview when SMTP is not configured.
- PWA support is scaffolded with a manifest and service worker.
- CI is scaffolded in `.github/workflows/ci.yml`.
- Backend smoke tests live in `backend/tests/smoke.test.js`.

## Progress tracking files

- `sprint-progress.md`
- `advance-module-review.md`
