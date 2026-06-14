# Next Pickup Sprint Tasks

This file captures the next implementation pickup items to move the HRMS toward a production-ready release.

## Production-ready goals
- Make the full project stable for real deployment
- Improve UI/UX to feel polished and user-friendly
- Complete dynamic master-data usage across all modules
- Complete document handling and exports/imports
- Increase automated test coverage and release confidence
- Add final release hardening for production environments

## Sprint 1 / Foundation hardening
- [ ] Add more backend tests beyond smoke tests
- [ ] Add auth flow integration tests
- [ ] Add permission-management integration tests
- [ ] Add advance two-stage approval/payout integration tests
- [ ] Finalize environment documentation for Windows/local setup
- [ ] Add better startup diagnostics and health checks

## Sprint 2 / Employee Management next pickup
- [x] Employee document uploading section added
- [x] Employee CSV import/export added
- [ ] Improve employee document UX (preview, file-type chips, validations, document categories polish)
- [ ] Add document download audit visibility in admin UI
- [ ] Add employee bulk import validation summary UI

## Sprint 3 / Attendance next pickup
- [x] Attendance export CSV added
- [x] Shifts and holidays displayed from settings masters
- [ ] Add attendance calendar / heatmap UI
- [ ] Use shifts more deeply in attendance validation logic
- [ ] Use holiday masters more deeply in attendance summary/report logic
- [ ] Add date filters for export and admin views

## Advance workflow next pickup
- [x] Separated approve vs payout permissions
- [x] Accounts role seed added
- [x] Department-aware approval/payout restriction foundation added
- [ ] Add dedicated approval queue vs payout queue filters/labels polish
- [ ] Add dashboard widgets for approval department and payout department queues
- [ ] Add settings validation for workflow departments

## Sprint 4 / Leave Management next pickup
- [x] Dynamic leave types wired from settings masters
- [ ] Add advanced leave policy rules
- [ ] Add leave overlap and balance rule polish
- [ ] Add leave calendar UI

## Sprint 5-6 / Payroll next pickup
- [ ] Wire payroll components and deduction types deeper from master data
- [ ] Improve payroll engine logic and calculation transparency
- [ ] Add printable / downloadable payslip formatting
- [ ] Add payroll report export

## Sprint 7 / Performance & Reports next pickup
- [ ] Improve review cycle workflows
- [ ] Add report exports (CSV/PDF where useful)
- [ ] Add richer visual dashboards and filters

## Sprint 8 / QA, UI polish, launch readiness
- [x] Improve shell/navigation UI polish pass started
- [ ] Improve visual polish across all admin pages
- [ ] Improve mobile UX on dense management screens
- [ ] Standardize empty/error/loading states everywhere
- [ ] Add more user-friendly styling and hierarchy in settings, permissions, payroll, and employee pages
- [ ] Add E2E tests for critical flows
- [ ] Prepare deployment-ready checklist and environment setup guide
- [ ] Add production observability and operational runbook

## Permissions & Settings ongoing tasks
- [ ] Continue deep enforcement of permissions across every action path
- [ ] Ensure delegated permission governance works for newly created roles
- [ ] Continue replacing hardcoded values with settings-driven master data everywhere
- [ ] Add better role/module audit visualization UI
