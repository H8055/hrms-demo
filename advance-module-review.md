# Advance Request Module Review vs Reference Diagrams

This review maps the current implementation to the two diagrams you shared.

## Diagram 1: Advance Request Flow

### Implemented
- Employee can submit advance request with:
  - amount
  - reason
  - repayment plan
  - optional notes
- New request is created with **pending** status.
- Admin / HR / Manager receive:
  - email notification
  - in-app notification
- Admin can review:
  - amount
  - reason
  - employee details
  - employee request history
  - activity log
- Admin can **approve** with optional note.
- Admin can **reject** with mandatory rejection reason.
- Employee receives:
  - email notification on approve / reject / paid
  - in-app notification on approve / reject / paid
- Admin can process payment with:
  - payment date
  - payment mode
  - reference number
- Status can move to **paid**.
- Audit / activity log is shown and visible in detail views.
- Employee and admin can both view the request history and status timeline.

### Covered business rules
- Duplicate request in the same month is blocked.
- Multiple active requests (`pending` or `approved`) are blocked.
- Only elevated roles can review / approve / reject / pay.
- Only approved requests can be marked as paid.
- Paid date cannot be in the future.

## Diagram 2: HRMS Client Flow

### Reflected in current foundation
- Login flow exists.
- Dashboard shell exists.
- Role-aware UI is reflected for:
  - employee
  - hr
  - manager
  - admin
- System notifications are now part of the app shell.

### Still future work for full HRMS scope
These are **not fully implemented yet** and should be handled in later modules:
- attendance
- leave
- payslip download
- employee CRUD
- payroll engine
- performance / appraisal
- reports

## Priority conclusion
The codebase is now aligned to start from the **Advance Request module as the priority implementation**, with responsive mobile/web support and end-to-end status tracking.
