import { env } from "./env.js";

export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "HRMS API",
    version: "0.2.0",
    description:
      "HRMS responsive MERN API covering auth, employees, attendance, leaves, advances, payroll, performance, reports, settings, notifications, and audit logs.",
  },
  servers: [{ url: `http://localhost:${env.port}/api` }],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Employees" },
    { name: "Attendance" },
    { name: "Leaves" },
    { name: "Advances" },
    { name: "Payroll" },
    { name: "Performance" },
    { name: "Reports" },
    { name: "Settings" },
    { name: "Notifications" },
    { name: "Audit" },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: { 200: { description: "OK" } },
      },
    },
    "/auth/bootstrap-status": {
      get: {
        tags: ["Auth"],
        summary: "Check whether first admin setup is required",
        responses: { 200: { description: "Bootstrap status" } },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register first admin or create user",
        responses: { 201: { description: "User created" } },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login user",
        responses: { 200: { description: "Login success" } },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Refresh access token",
        responses: { 200: { description: "Refreshed token" } },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout user",
        responses: { 200: { description: "Logout success" } },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current user profile",
        responses: { 200: { description: "Current user" } },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request password reset email",
        responses: { 200: { description: "Reset mail queued" } },
      },
    },
    "/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset password using token",
        responses: { 200: { description: "Password reset" } },
      },
    },
    "/employees": {
      get: {
        tags: ["Employees"],
        summary: "List employees",
        responses: { 200: { description: "Employee list" } },
      },
      post: {
        tags: ["Employees"],
        summary: "Create employee",
        responses: { 201: { description: "Employee created" } },
      },
    },
    "/employees/me": {
      get: {
        tags: ["Employees"],
        summary: "Get self employee profile",
        responses: { 200: { description: "Self profile" } },
      },
    },
    "/employees/org-chart": {
      get: {
        tags: ["Employees"],
        summary: "Get org chart",
        responses: { 200: { description: "Org chart" } },
      },
    },
    "/employees/{id}": {
      get: {
        tags: ["Employees"],
        summary: "Get employee by ID",
        responses: { 200: { description: "Employee details" } },
      },
      put: {
        tags: ["Employees"],
        summary: "Update employee",
        responses: { 200: { description: "Employee updated" } },
      },
    },
    "/employees/{id}/deactivate": {
      put: {
        tags: ["Employees"],
        summary: "Deactivate employee",
        responses: { 200: { description: "Employee deactivated" } },
      },
    },
    "/attendance/summary": {
      get: {
        tags: ["Attendance"],
        summary: "Attendance summary",
        responses: { 200: { description: "Attendance summary" } },
      },
    },
    "/attendance/mine": {
      get: {
        tags: ["Attendance"],
        summary: "My attendance records",
        responses: { 200: { description: "Attendance list" } },
      },
    },
    "/attendance/check-in": {
      post: {
        tags: ["Attendance"],
        summary: "Check in",
        responses: { 200: { description: "Checked in" } },
      },
    },
    "/attendance/check-out": {
      post: {
        tags: ["Attendance"],
        summary: "Check out",
        responses: { 200: { description: "Checked out" } },
      },
    },
    "/attendance/regularize": {
      post: {
        tags: ["Attendance"],
        summary: "Request attendance regularization",
        responses: { 201: { description: "Regularization submitted" } },
      },
    },
    "/attendance/{id}/regularization-decision": {
      put: {
        tags: ["Attendance"],
        summary: "Approve or reject regularization",
        responses: { 200: { description: "Regularization decided" } },
      },
    },
    "/leaves/summary": {
      get: {
        tags: ["Leaves"],
        summary: "Leave summary",
        responses: { 200: { description: "Leave summary" } },
      },
    },
    "/leaves/mine": {
      get: {
        tags: ["Leaves"],
        summary: "My leave requests",
        responses: { 200: { description: "Leave list" } },
      },
    },
    "/leaves": {
      get: {
        tags: ["Leaves"],
        summary: "List leave requests",
        responses: { 200: { description: "Leave list" } },
      },
      post: {
        tags: ["Leaves"],
        summary: "Create leave request",
        responses: { 201: { description: "Leave created" } },
      },
    },
    "/leaves/{id}/decision": {
      put: {
        tags: ["Leaves"],
        summary: "Approve or reject leave",
        responses: { 200: { description: "Leave decided" } },
      },
    },
    "/advances/summary": {
      get: {
        tags: ["Advances"],
        summary: "Advance summary",
        responses: { 200: { description: "Advance summary" } },
      },
    },
    "/advances/mine": {
      get: {
        tags: ["Advances"],
        summary: "My advances",
        responses: { 200: { description: "Advance list" } },
      },
    },
    "/advances": {
      get: {
        tags: ["Advances"],
        summary: "List advances",
        responses: { 200: { description: "Advance list" } },
      },
      post: {
        tags: ["Advances"],
        summary: "Create advance request",
        responses: { 201: { description: "Advance created" } },
      },
    },
    "/advances/{id}": {
      get: {
        tags: ["Advances"],
        summary: "Get advance details",
        responses: { 200: { description: "Advance detail" } },
      },
    },
    "/advances/{id}/approve": {
      put: {
        tags: ["Advances"],
        summary: "Approve advance",
        responses: { 200: { description: "Advance approved" } },
      },
    },
    "/advances/{id}/reject": {
      put: {
        tags: ["Advances"],
        summary: "Reject advance",
        responses: { 200: { description: "Advance rejected" } },
      },
    },
    "/advances/{id}/pay": {
      put: {
        tags: ["Advances"],
        summary: "Mark advance as paid",
        responses: { 200: { description: "Advance paid" } },
      },
    },
    "/payroll/summary": {
      get: {
        tags: ["Payroll"],
        summary: "Payroll summary",
        responses: { 200: { description: "Payroll summary" } },
      },
    },
    "/payroll": {
      get: {
        tags: ["Payroll"],
        summary: "List payroll records",
        responses: { 200: { description: "Payroll list" } },
      },
    },
    "/payroll/structures": {
      get: {
        tags: ["Payroll"],
        summary: "List salary structures",
        responses: { 200: { description: "Structure list" } },
      },
      post: {
        tags: ["Payroll"],
        summary: "Create or update salary structure",
        responses: { 200: { description: "Structure saved" } },
      },
    },
    "/payroll/run": {
      post: {
        tags: ["Payroll"],
        summary: "Run payroll for month",
        responses: { 200: { description: "Payroll run complete" } },
      },
    },
    "/payroll/{id}/pay": {
      put: {
        tags: ["Payroll"],
        summary: "Mark payroll as paid",
        responses: { 200: { description: "Payroll paid" } },
      },
    },
    "/performance/summary": {
      get: {
        tags: ["Performance"],
        summary: "Performance summary",
        responses: { 200: { description: "Performance summary" } },
      },
    },
    "/performance": {
      get: {
        tags: ["Performance"],
        summary: "List reviews",
        responses: { 200: { description: "Reviews list" } },
      },
      post: {
        tags: ["Performance"],
        summary: "Create review",
        responses: { 201: { description: "Review created" } },
      },
    },
    "/reports/overview": {
      get: {
        tags: ["Reports"],
        summary: "Overview report",
        responses: { 200: { description: "Overview report" } },
      },
    },
    "/settings": {
      get: {
        tags: ["Settings"],
        summary: "Get company settings",
        responses: { 200: { description: "Settings" } },
      },
      put: {
        tags: ["Settings"],
        summary: "Update company settings",
        responses: { 200: { description: "Settings saved" } },
      },
    },
    "/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "List notifications",
        responses: { 200: { description: "Notifications list" } },
      },
    },
    "/notifications/unread-count": {
      get: {
        tags: ["Notifications"],
        summary: "Unread notification count",
        responses: { 200: { description: "Unread count" } },
      },
    },
    "/notifications/read-all": {
      put: {
        tags: ["Notifications"],
        summary: "Mark all notifications read",
        responses: { 200: { description: "Marked all read" } },
      },
    },
    "/notifications/{id}/read": {
      put: {
        tags: ["Notifications"],
        summary: "Mark notification read",
        responses: { 200: { description: "Marked read" } },
      },
    },
    "/audit-logs": {
      get: {
        tags: ["Audit"],
        summary: "List audit logs",
        responses: { 200: { description: "Audit list" } },
      },
    },
  },
};
