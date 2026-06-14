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
- ✅ separated approval and payout permissions for advances
- ✅ department-aware advance workflow foundation (approval dept / payout dept)
- ✅ in-app notifications
- ✅ audit logging foundations
- ✅ Swagger docs scaffold
- ✅ backend production middleware foundation (helmet, compression, auth rate limit)

## Sprint 2 — Employee Management
- ✅ employee directory API/UI
- ✅ create/update employee
- ✅ deactivate employee
- ✅ self-profile view
- ✅ org chart snapshot
- ✅ dynamic roles / departments / designations / employment statuses wired from settings masters
- ✅ employee CSV import / export
- ✅ employee document upload / list / delete foundation
- ⏳ richer document categories / advanced audit UI pending

## Sprint 3 — Attendance
- ✅ check-in
- ✅ check-out
- ✅ attendance history
- ✅ attendance summary
- ✅ regularization request flow
- ✅ regularization decision flow
- ✅ attendance CSV export
- ✅ configured shifts / holidays shown from settings masters
- ⏳ deeper shift / holiday logic and calendar UI pending

## Sprint 4 — Leave Management
- ✅ leave application flow
- ✅ leave approval / rejection flow
- ✅ leave balances
- ✅ leave summary
- ✅ dynamic leave types from settings masters
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
- ✅ backend smoke tests
- ✅ PWA manifest + service worker scaffold
- ✅ GitHub Actions CI scaffold
- ✅ settings master-data UI foundation
- ✅ dynamic roles + dynamic master item backend foundation
- ✅ next-pickup production-ready backlog captured
- ✅ shell and navigation UI polish pass started
- ⏳ deeper automated coverage / deployment hardening / final UI polish still pending

## Permissions & Settings foundation
- ✅ RolePermission model
- ✅ Permissions page foundation
- ✅ Delegable permission governance (via permissions module)
- ✅ Dynamic sidebar visibility by role
- ✅ Settings bundle / form-options APIs
- ⏳ Full deep enforcement + all-module polish still pending

## Demo helpers
- `backend/src/seed.js`
- Run with: `npm run seed -w backend`

## Demo credentials after seed
- admin@example.com / Password@123
- hr@example.com / Password@123
- manager@example.com / Password@123
- employee@example.com / Password@123
