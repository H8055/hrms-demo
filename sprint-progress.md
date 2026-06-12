# HRMS Sprint Progress

This file summarizes the implementation status in the workspace after extending the project beyond the priority Advance Request module.

## Sprint 1 — Foundation, Auth & Advance Module
- ✅ Auth API
- ✅ JWT + refresh flow
- ✅ responsive login shell
- ✅ forgot/reset password screens
- ✅ responsive dashboard shell
- ✅ 404 + error boundary
- ✅ advance request end-to-end flow
- ✅ in-app notifications
- ✅ audit logging foundations
- ✅ Swagger docs scaffold

## Sprint 2 — Employee Management
- ✅ employee directory API/UI
- ✅ create/update employee
- ✅ deactivate employee
- ✅ self-profile view
- ✅ org chart snapshot
- ⏳ documents / bulk CSV / full audit UI pending

## Sprint 3 — Attendance
- ✅ check-in
- ✅ check-out
- ✅ attendance history
- ✅ attendance summary
- ✅ regularization request flow
- ✅ regularization decision flow
- ⏳ holiday master / shift config / Excel export pending

## Sprint 4 — Leave Management
- ✅ leave application flow
- ✅ leave approval / rejection flow
- ✅ leave balances
- ✅ leave summary
- ⏳ advanced leave policy rules pending

## Sprint 5-6 — Payroll Processing
- ✅ salary structure setup
- ✅ payroll run
- ✅ payroll records / payslip listing
- ✅ payroll paid status
- ✅ basic advance deduction linkage
- ⏳ detailed payroll engine / statutory complexity pending

## Sprint 7 — Performance & Reports
- ✅ performance review CRUD-lite flow
- ✅ goals + rating + feedback capture
- ✅ reports overview dashboard
- ⏳ deeper appraisal cycles / exports pending

## Sprint 8 — QA, Polish & Launch
- ✅ responsive layout across modules
- ✅ mobile/tablet/desktop navigation pattern
- ✅ workspace preview/build validation
- ✅ backend smoke tests
- ✅ PWA manifest + service worker scaffold
- ✅ GitHub Actions CI scaffold
- ⏳ deeper automated coverage / deployment hardening still pending

## Demo helpers
- `backend/src/seed.js`
- Run with: `npm run seed -w backend`

## Demo credentials after seed
- admin@example.com / Password@123
- hr@example.com / Password@123
- manager@example.com / Password@123
- employee@example.com / Password@123
