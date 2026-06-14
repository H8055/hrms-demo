import { env } from './env.js';

const json = (schema, examples) => ({
  'application/json': {
    schema,
    ...(examples ? { examples } : {})
  }
});

const response = (description, schema, examples) => ({
  description,
  content: json(schema, examples)
});

const messageResponse = (description = 'Successful operation') =>
  response(description, { $ref: '#/components/schemas/MessageResponse' });

const authSecurity = [{ bearerAuth: [] }];
const authOrCookieSecurity = [{ bearerAuth: [] }, { cookieAuth: [] }];

const errorResponses = {
  400: response('Validation or bad request error', { $ref: '#/components/schemas/ErrorResponse' }),
  401: response('Authentication required or invalid token', { $ref: '#/components/schemas/ErrorResponse' }),
  403: response('Forbidden for current role', { $ref: '#/components/schemas/ErrorResponse' }),
  404: response('Resource not found', { $ref: '#/components/schemas/ErrorResponse' }),
  409: response('Conflict / duplicate record', { $ref: '#/components/schemas/ErrorResponse' }),
  500: response('Internal server error', { $ref: '#/components/schemas/ErrorResponse' })
};

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'HRMS API',
    version: '0.3.0',
    description:
      'Complete interactive API documentation for the responsive HRMS platform. Use **Try it out** for every action. For protected endpoints, first call `/auth/login` and then click **Authorize** with the returned bearer token.'
  },
  servers: [{ url: `http://localhost:${env.port}/api`, description: 'Local API server' }],
  tags: [
    { name: 'Health', description: 'Health and availability checks' },
    { name: 'Auth', description: 'Authentication, bootstrap setup, and password recovery' },
    { name: 'Employees', description: 'Employee directory, self profile, and org chart' },
    { name: 'Attendance', description: 'Check-in/out, summaries, and regularization flow' },
    { name: 'Leaves', description: 'Leave request and approval flow' },
    { name: 'Advances', description: 'Priority advance request module and approval/payment lifecycle' },
    { name: 'Payroll', description: 'Salary structures, payroll runs, and payslip records' },
    { name: 'Performance', description: 'Performance reviews, goals, and ratings' },
    { name: 'Reports', description: 'Cross-module reporting endpoints' },
    { name: 'Settings', description: 'Company settings and HRMS configuration' },
    { name: 'Permissions', description: 'Role-based permission matrix and sidebar visibility management' },
    { name: 'Notifications', description: 'In-app user notifications' },
    { name: 'Audit', description: 'Audit logs for sensitive actions' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the access token returned by `/auth/login`.'
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'refreshToken',
        description: 'Refresh token cookie set automatically by `/auth/login`.'
      }
    },
    schemas: {
      MessageResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Operation completed successfully' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Validation failed' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true
            }
          }
        }
      },
      LeaveBalances: {
        type: 'object',
        properties: {
          annual: { type: 'number', example: 18 },
          sick: { type: 'number', example: 8 },
          casual: { type: 'number', example: 6 }
        }
      },
      BankDetails: {
        type: 'object',
        properties: {
          accountName: { type: 'string', example: 'Riya Employee' },
          accountNumber: { type: 'string', example: '123456789012' },
          ifsc: { type: 'string', example: 'SBIN0001234' }
        }
      },
      UserSummary: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '6849f5fd33943cb8ba12ab34' },
          name: { type: 'string', example: 'Riya Employee' },
          email: { type: 'string', example: 'employee@example.com' },
          role: { type: 'string', example: 'employee' },
          department: { type: 'string', example: 'Engineering' },
          designation: { type: 'string', example: 'Software Engineer' },
          employeeCode: { type: 'string', example: 'EMP-001' },
          phone: { type: 'string', example: '+91 9876543210' },
          joiningDate: { type: 'string', format: 'date-time', nullable: true },
          employmentStatus: { type: 'string', example: 'active' },
          leaveBalances: { $ref: '#/components/schemas/LeaveBalances' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      AuthResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Login successful' },
          accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          user: { $ref: '#/components/schemas/UserSummary' }
        }
      },
      BootstrapStatus: {
        type: 'object',
        properties: {
          hasUsers: { type: 'boolean', example: true },
          requiresSetup: { type: 'boolean', example: false },
          usersCount: { type: 'number', example: 5 }
        }
      },
      Employee: {
        allOf: [
          { $ref: '#/components/schemas/UserSummary' },
          {
            type: 'object',
            properties: {
              address: { type: 'string', example: 'Bengaluru, India' },
              emergencyContactName: { type: 'string', example: 'Asha Employee' },
              emergencyContactPhone: { type: 'string', example: '+91 9000000000' },
              bankDetails: { $ref: '#/components/schemas/BankDetails' },
              manager: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                  designation: { type: 'string' }
                }
              }
            }
          }
        ]
      },
      OrgChartItem: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          designation: { type: 'string' },
          department: { type: 'string' },
          role: { type: 'string' },
          managerName: { type: 'string', nullable: true },
          managerId: { type: 'string', nullable: true }
        }
      },
      AttendanceRecord: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          date: { type: 'string', format: 'date-time' },
          checkIn: { type: 'string', format: 'date-time', nullable: true },
          checkOut: { type: 'string', format: 'date-time', nullable: true },
          status: { type: 'string', example: 'present' },
          source: { type: 'string', example: 'self' },
          user: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              department: { type: 'string' }
            }
          },
          regularization: {
            type: 'object',
            additionalProperties: true,
            example: {
              requestedAt: '2026-06-12T08:30:00.000Z',
              reason: 'Internet issue during check-in',
              requestedCheckIn: '2026-06-11T09:10:00.000Z',
              requestedCheckOut: '2026-06-11T18:30:00.000Z',
              status: 'pending'
            }
          }
        }
      },
      LeaveRequest: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          leaveType: { type: 'string', example: 'annual' },
          fromDate: { type: 'string', format: 'date-time' },
          toDate: { type: 'string', format: 'date-time' },
          days: { type: 'number', example: 2 },
          reason: { type: 'string', example: 'Family function' },
          status: { type: 'string', example: 'pending' },
          managerComment: { type: 'string', example: 'Approved for planned leave' },
          decidedAt: { type: 'string', format: 'date-time', nullable: true },
          user: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              department: { type: 'string' }
            }
          },
          decidedBy: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' }
            }
          }
        }
      },
      AdvanceRequest: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          amount: { type: 'number', example: 25000 },
          reason: { type: 'string', example: 'Medical emergency support' },
          repaymentPlan: { type: 'string', example: 'Deduct over 5 salary cycles' },
          status: { type: 'string', example: 'approved' },
          notes: { type: 'string', example: 'Need quick processing' },
          adminNote: { type: 'string', example: 'Approved as per policy' },
          rejectionReason: { type: 'string', example: '' },
          approvedAt: { type: 'string', format: 'date-time', nullable: true },
          rejectedAt: { type: 'string', format: 'date-time', nullable: true },
          paidAt: { type: 'string', format: 'date-time', nullable: true },
          paymentMode: { type: 'string', example: 'bank' },
          reference: { type: 'string', example: 'PAY-2026-001' },
          createdAt: { type: 'string', format: 'date-time' },
          requestedBy: { $ref: '#/components/schemas/Employee' },
          processedBy: { $ref: '#/components/schemas/UserSummary' },
          approvedBy: { $ref: '#/components/schemas/UserSummary' }
        }
      },
      AuditLog: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          action: { type: 'string', example: 'advance.approved' },
          entityType: { type: 'string', example: 'AdvanceRequest' },
          entityId: { type: 'string' },
          metadata: { type: 'object', additionalProperties: true },
          createdAt: { type: 'string', format: 'date-time' },
          actor: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              role: { type: 'string' }
            }
          }
        }
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string', example: 'advance_status' },
          title: { type: 'string', example: 'Advance request approved' },
          message: { type: 'string', example: 'Your request was approved.' },
          link: { type: 'string', example: '/advances/my' },
          relatedEntityType: { type: 'string', example: 'AdvanceRequest' },
          relatedEntityId: { type: 'string' },
          metadata: { type: 'object', additionalProperties: true },
          isRead: { type: 'boolean', example: false },
          readAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      SalaryStructure: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          basic: { type: 'number', example: 40000 },
          hra: { type: 'number', example: 16000 },
          allowances: { type: 'number', example: 9000 },
          statutoryDeductions: { type: 'number', example: 4500 },
          otherDeductions: { type: 'number', example: 1000 },
          user: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              department: { type: 'string' }
            }
          }
        }
      },
      PayrollRecord: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          month: { type: 'string', example: '2026-06' },
          grossPay: { type: 'number', example: 65000 },
          statutoryDeductions: { type: 'number', example: 4500 },
          otherDeductions: { type: 'number', example: 1000 },
          advanceDeduction: { type: 'number', example: 25000 },
          totalDeductions: { type: 'number', example: 30500 },
          netPay: { type: 'number', example: 34500 },
          status: { type: 'string', example: 'paid' },
          paidAt: { type: 'string', format: 'date-time', nullable: true },
          user: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              department: { type: 'string' }
            }
          },
          generatedBy: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' }
            }
          }
        }
      },
      PerformanceReview: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          cycle: { type: 'string', example: '2026 H1' },
          goals: {
            type: 'array',
            items: { type: 'string' },
            example: ['Improve delivery predictability', 'Mentor juniors']
          },
          rating: { type: 'number', example: 4.3 },
          feedback: { type: 'string', example: 'Strong ownership and delivery.' },
          status: { type: 'string', example: 'completed' },
          createdAt: { type: 'string', format: 'date-time' },
          user: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              department: { type: 'string' }
            }
          },
          reviewer: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' }
            }
          }
        }
      },
      CompanySettings: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          companyName: { type: 'string', example: 'Arena HRMS Demo' },
          companyEmail: { type: 'string', example: 'info@example.com' },
          companyPhone: { type: 'string', example: '+91 90000 00000' },
          logoUrl: { type: 'string', example: 'https://example.com/logo.png' },
          address: { type: 'string', example: 'Bengaluru, India' },
          leaveTypes: {
            type: 'array',
            items: { type: 'string' },
            example: ['annual', 'sick', 'casual', 'unpaid']
          },
          holidays: {
            type: 'array',
            items: { type: 'string' },
            example: ['2026-01-26', '2026-08-15']
          }
        }
      },
      OverviewReport: {
        type: 'object',
        properties: {
          employees: { type: 'number', example: 5 },
          attendance: { type: 'object', additionalProperties: true },
          leaves: { type: 'object', additionalProperties: true },
          payroll: { type: 'object', additionalProperties: true },
          advances: { type: 'object', additionalProperties: true },
          performance: { type: 'object', additionalProperties: true }
        }
      }
    }
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          200: response('API is healthy', {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'ok' },
              service: { type: 'string', example: 'hrms-api' },
              environment: { type: 'string', example: 'development' },
              mongoState: { type: 'number', example: 1 },
              timestamp: { type: 'string', format: 'date-time' }
            }
          })
        }
      }
    },
    '/health/ready': {
      get: {
        tags: ['Health'],
        summary: 'Readiness check for deployment probes',
        responses: {
          200: response('Application is ready', {
            type: 'object',
            properties: {
              ready: { type: 'boolean', example: true },
              database: { type: 'string', example: 'connected' },
              timestamp: { type: 'string', format: 'date-time' }
            }
          }),
          503: response('Application is not ready', {
            type: 'object',
            properties: {
              ready: { type: 'boolean', example: false },
              database: { type: 'string', example: 'not-ready' },
              timestamp: { type: 'string', format: 'date-time' }
            }
          })
        }
      }
    },

    '/auth/bootstrap-status': {
      get: {
        tags: ['Auth'],
        summary: 'Check whether first admin setup is required',
        responses: { 200: response('Bootstrap status', { $ref: '#/components/schemas/BootstrapStatus' }) }
      }
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register first admin or create additional user',
        description: 'If no users exist, this creates the first admin. After bootstrap, only an authenticated admin can create more users.',
        security: authOrCookieSecurity,
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['name', 'email', 'password'],
            properties: {
              name: { type: 'string', example: 'Super Admin' },
              email: { type: 'string', format: 'email', example: 'admin@example.com' },
              password: { type: 'string', format: 'password', example: 'Password@123' },
              role: { type: 'string', enum: ['admin', 'hr', 'manager', 'employee'], example: 'employee' }
            }
          })
        },
        responses: {
          201: response('User created', {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'First admin account created successfully' },
              user: { $ref: '#/components/schemas/UserSummary' }
            }
          }),
          ...errorResponses
        }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login user',
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: { type: 'string', format: 'email', example: 'admin@example.com' },
              password: { type: 'string', format: 'password', example: 'Password@123' }
            }
          })
        },
        responses: {
          200: response('Login success', { $ref: '#/components/schemas/AuthResponse' }),
          ...errorResponses
        }
      }
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        security: authOrCookieSecurity,
        responses: {
          200: response('Refreshed access token', {
            type: 'object',
            properties: {
              accessToken: { type: 'string' },
              user: { $ref: '#/components/schemas/UserSummary' }
            }
          }),
          ...errorResponses
        }
      }
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout user',
        security: authOrCookieSecurity,
        responses: { 200: messageResponse('Logged out successfully'), ...errorResponses }
      }
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user profile',
        security: authSecurity,
        responses: {
          200: response('Current user profile', {
            type: 'object',
            properties: { user: { $ref: '#/components/schemas/UserSummary' } }
          }),
          ...errorResponses
        }
      }
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request password reset email',
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['email'],
            properties: { email: { type: 'string', format: 'email', example: 'employee@example.com' } }
          })
        },
        responses: {
          200: response('Reset email initiated', {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'If that email exists, a reset link has been sent' },
              previewToken: { type: 'string', nullable: true }
            }
          }),
          ...errorResponses
        }
      }
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password with token',
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['token', 'password'],
            properties: {
              token: { type: 'string', example: 'af34bd12...' },
              password: { type: 'string', format: 'password', example: 'NewPassword@123' }
            }
          })
        },
        responses: { 200: messageResponse('Password reset successful'), ...errorResponses }
      }
    },

    '/employees/me': {
      get: {
        tags: ['Employees'],
        summary: 'Get self employee profile',
        security: authSecurity,
        responses: {
          200: response('Self profile', {
            type: 'object',
            properties: { employee: { $ref: '#/components/schemas/Employee' } }
          }),
          ...errorResponses
        }
      }
    },
    '/employees/org-chart': {
      get: {
        tags: ['Employees'],
        summary: 'Get organization chart snapshot',
        security: authSecurity,
        responses: {
          200: response('Org chart', {
            type: 'object',
            properties: {
              items: { type: 'array', items: { $ref: '#/components/schemas/OrgChartItem' } }
            }
          }),
          ...errorResponses
        }
      }
    },
    '/employees': {
      get: {
        tags: ['Employees'],
        summary: 'List employees',
        security: authSecurity,
        parameters: [
          { in: 'query', name: 'q', schema: { type: 'string' }, description: 'Search by name, email, department, designation, code, or phone' },
          { in: 'query', name: 'role', schema: { type: 'string' }, description: 'Filter by role' },
          { in: 'query', name: 'status', schema: { type: 'string' }, description: 'Filter by employmentStatus' }
        ],
        responses: {
          200: response('Employee list', {
            type: 'object',
            properties: {
              items: { type: 'array', items: { $ref: '#/components/schemas/Employee' } }
            }
          }),
          ...errorResponses
        }
      },
      post: {
        tags: ['Employees'],
        summary: 'Create employee',
        security: authSecurity,
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['name', 'email'],
            properties: {
              name: { type: 'string', example: 'Neha Analyst' },
              email: { type: 'string', format: 'email', example: 'neha@example.com' },
              password: { type: 'string', format: 'password', example: 'Password@123' },
              role: { type: 'string', enum: ['admin', 'hr', 'manager', 'employee'], example: 'employee' },
              department: { type: 'string', example: 'Finance' },
              designation: { type: 'string', example: 'Finance Analyst' },
              employeeCode: { type: 'string', example: 'EMP-002' },
              phone: { type: 'string', example: '+91 9000000001' },
              address: { type: 'string', example: 'Hyderabad, India' },
              joiningDate: { type: 'string', format: 'date', nullable: true },
              manager: { type: 'string', nullable: true },
              emergencyContactName: { type: 'string' },
              emergencyContactPhone: { type: 'string' }
            }
          })
        },
        responses: {
          201: response('Employee created', {
            type: 'object',
            properties: {
              message: { type: 'string' },
              employee: { $ref: '#/components/schemas/Employee' }
            }
          }),
          ...errorResponses
        }
      }
    },
    '/employees/{id}': {
      get: {
        tags: ['Employees'],
        summary: 'Get employee by id',
        security: authSecurity,
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          200: response('Employee detail', {
            type: 'object',
            properties: { employee: { $ref: '#/components/schemas/Employee' } }
          }),
          ...errorResponses
        }
      },
      put: {
        tags: ['Employees'],
        summary: 'Update employee',
        security: authSecurity,
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string', enum: ['admin', 'hr', 'manager', 'employee'] },
              department: { type: 'string' },
              designation: { type: 'string' },
              employeeCode: { type: 'string' },
              phone: { type: 'string' },
              address: { type: 'string' },
              joiningDate: { type: 'string', format: 'date', nullable: true },
              manager: { type: 'string', nullable: true },
              employmentStatus: { type: 'string', enum: ['active', 'onboarded', 'exited'] },
              emergencyContactName: { type: 'string' },
              emergencyContactPhone: { type: 'string' },
              isActive: { type: 'boolean' },
              leaveBalances: { $ref: '#/components/schemas/LeaveBalances' },
              bankDetails: { $ref: '#/components/schemas/BankDetails' }
            }
          })
        },
        responses: {
          200: response('Employee updated', {
            type: 'object',
            properties: {
              message: { type: 'string' },
              employee: { $ref: '#/components/schemas/Employee' }
            }
          }),
          ...errorResponses
        }
      }
    },
    '/employees/{id}/deactivate': {
      put: {
        tags: ['Employees'],
        summary: 'Mark employee as exited / deactivate',
        security: authSecurity,
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: messageResponse('Employee marked as exited'), ...errorResponses }
      }
    },

    '/attendance/mine': {
      get: {
        tags: ['Attendance'],
        summary: 'Get my attendance records',
        security: authSecurity,
        responses: {
          200: response('Attendance list', {
            type: 'object',
            properties: { items: { type: 'array', items: { $ref: '#/components/schemas/AttendanceRecord' } } }
          }),
          ...errorResponses
        }
      }
    },
    '/attendance/summary': {
      get: {
        tags: ['Attendance'],
        summary: 'Get attendance summary',
        security: authSecurity,
        responses: {
          200: response('Attendance summary', {
            type: 'object',
            properties: {
              present: { type: 'number' },
              absent: { type: 'number' },
              onLeave: { type: 'number' },
              pendingRegularization: { type: 'number' },
              total: { type: 'number' }
            }
          }),
          ...errorResponses
        }
      }
    },
    '/attendance/check-in': {
      post: {
        tags: ['Attendance'],
        summary: 'Check in for today',
        security: authSecurity,
        responses: {
          200: response('Checked in', {
            type: 'object',
            properties: {
              message: { type: 'string' },
              attendance: { $ref: '#/components/schemas/AttendanceRecord' }
            }
          }),
          ...errorResponses
        }
      }
    },
    '/attendance/check-out': {
      post: {
        tags: ['Attendance'],
        summary: 'Check out for today',
        security: authSecurity,
        responses: {
          200: response('Checked out', {
            type: 'object',
            properties: {
              message: { type: 'string' },
              attendance: { $ref: '#/components/schemas/AttendanceRecord' }
            }
          }),
          ...errorResponses
        }
      }
    },
    '/attendance/regularize': {
      post: {
        tags: ['Attendance'],
        summary: 'Submit attendance regularization request',
        security: authSecurity,
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['date', 'reason'],
            properties: {
              date: { type: 'string', format: 'date', example: '2026-06-11' },
              reason: { type: 'string', example: 'Internet issue during check-in' },
              requestedCheckIn: { type: 'string', format: 'date-time', nullable: true },
              requestedCheckOut: { type: 'string', format: 'date-time', nullable: true }
            }
          })
        },
        responses: {
          201: response('Regularization submitted', {
            type: 'object',
            properties: {
              message: { type: 'string' },
              attendance: { $ref: '#/components/schemas/AttendanceRecord' }
            }
          }),
          ...errorResponses
        }
      }
    },
    '/attendance': {
      get: {
        tags: ['Attendance'],
        summary: 'List attendance records (admin / HR / manager)',
        security: authSecurity,
        parameters: [
          { in: 'query', name: 'user', schema: { type: 'string' } },
          { in: 'query', name: 'status', schema: { type: 'string' } },
          { in: 'query', name: 'dateFrom', schema: { type: 'string', format: 'date' } },
          { in: 'query', name: 'dateTo', schema: { type: 'string', format: 'date' } }
        ],
        responses: {
          200: response('Attendance records', {
            type: 'object',
            properties: { items: { type: 'array', items: { $ref: '#/components/schemas/AttendanceRecord' } } }
          }),
          ...errorResponses
        }
      }
    },
    '/attendance/{id}/regularization-decision': {
      put: {
        tags: ['Attendance'],
        summary: 'Approve or reject regularization request',
        security: authSecurity,
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['decision'],
            properties: {
              decision: { type: 'string', enum: ['approved', 'rejected'], example: 'approved' },
              comment: { type: 'string', example: 'Approved after review' }
            }
          })
        },
        responses: {
          200: response('Regularization decided', {
            type: 'object',
            properties: {
              message: { type: 'string' },
              attendance: { $ref: '#/components/schemas/AttendanceRecord' }
            }
          }),
          ...errorResponses
        }
      }
    },

    '/leaves/mine': {
      get: {
        tags: ['Leaves'],
        summary: 'Get my leave requests',
        security: authSecurity,
        responses: {
          200: response('Leave list', {
            type: 'object',
            properties: { items: { type: 'array', items: { $ref: '#/components/schemas/LeaveRequest' } } }
          }),
          ...errorResponses
        }
      }
    },
    '/leaves/summary': {
      get: {
        tags: ['Leaves'],
        summary: 'Get leave summary and balances',
        security: authSecurity,
        responses: {
          200: response('Leave summary', {
            type: 'object',
            properties: {
              balances: { $ref: '#/components/schemas/LeaveBalances' },
              pending: { type: 'number' },
              approved: { type: 'number' },
              rejected: { type: 'number' },
              totalDaysApproved: { type: 'number' }
            }
          }),
          ...errorResponses
        }
      }
    },
    '/leaves': {
      get: {
        tags: ['Leaves'],
        summary: 'List leave requests (admin / HR / manager)',
        security: authSecurity,
        parameters: [
          { in: 'query', name: 'status', schema: { type: 'string', enum: ['pending', 'approved', 'rejected'] } },
          { in: 'query', name: 'user', schema: { type: 'string' } }
        ],
        responses: {
          200: response('Leave requests', {
            type: 'object',
            properties: { items: { type: 'array', items: { $ref: '#/components/schemas/LeaveRequest' } } }
          }),
          ...errorResponses
        }
      },
      post: {
        tags: ['Leaves'],
        summary: 'Create leave request',
        security: authSecurity,
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['leaveType', 'fromDate', 'toDate', 'reason'],
            properties: {
              leaveType: { type: 'string', enum: ['annual', 'sick', 'casual', 'unpaid'], example: 'annual' },
              fromDate: { type: 'string', format: 'date', example: '2026-06-15' },
              toDate: { type: 'string', format: 'date', example: '2026-06-16' },
              reason: { type: 'string', example: 'Family function' }
            }
          })
        },
        responses: {
          201: response('Leave created', {
            type: 'object',
            properties: { message: { type: 'string' }, leave: { $ref: '#/components/schemas/LeaveRequest' } }
          }),
          ...errorResponses
        }
      }
    },
    '/leaves/{id}/decision': {
      put: {
        tags: ['Leaves'],
        summary: 'Approve or reject leave request',
        security: authSecurity,
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['decision'],
            properties: {
              decision: { type: 'string', enum: ['approved', 'rejected'], example: 'approved' },
              comment: { type: 'string', example: 'Approved as discussed' }
            }
          })
        },
        responses: {
          200: response('Leave request decided', {
            type: 'object',
            properties: { message: { type: 'string' }, leave: { $ref: '#/components/schemas/LeaveRequest' } }
          }),
          ...errorResponses
        }
      }
    },

    '/advances/mine': {
      get: {
        tags: ['Advances'],
        summary: 'Get my advance requests',
        security: authSecurity,
        responses: {
          200: response('Advance list', {
            type: 'object',
            properties: { items: { type: 'array', items: { $ref: '#/components/schemas/AdvanceRequest' } } }
          }),
          ...errorResponses
        }
      }
    },
    '/advances/summary': {
      get: {
        tags: ['Advances'],
        summary: 'Get advance summary',
        security: authSecurity,
        responses: {
          200: response('Advance summary', {
            type: 'object',
            properties: {
              totalRequests: { type: 'number' },
              pendingCount: { type: 'number' },
              approvedCount: { type: 'number' },
              rejectedCount: { type: 'number' },
              paidCount: { type: 'number' },
              totalDisbursed: { type: 'number' },
              thisMonthRequested: { type: 'number' },
              thisMonthDisbursed: { type: 'number' },
              hasActiveRequest: { type: 'boolean' }
            }
          }),
          ...errorResponses
        }
      }
    },
    '/advances': {
      get: {
        tags: ['Advances'],
        summary: 'List advance requests (admin / HR / manager)',
        security: authSecurity,
        parameters: [
          { in: 'query', name: 'status', schema: { type: 'string', enum: ['pending', 'approved', 'rejected', 'paid'] } },
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
          { in: 'query', name: 'q', schema: { type: 'string' }, description: 'Search requester name/email/department/designation' },
          { in: 'query', name: 'employee', schema: { type: 'string' } },
          { in: 'query', name: 'dateFrom', schema: { type: 'string', format: 'date' } },
          { in: 'query', name: 'dateTo', schema: { type: 'string', format: 'date' } }
        ],
        responses: {
          200: response('Advance requests', {
            type: 'object',
            properties: {
              page: { type: 'number' },
              limit: { type: 'number' },
              total: { type: 'number' },
              pages: { type: 'number' },
              items: { type: 'array', items: { $ref: '#/components/schemas/AdvanceRequest' } }
            }
          }),
          ...errorResponses
        }
      },
      post: {
        tags: ['Advances'],
        summary: 'Create advance request',
        security: authSecurity,
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['amount', 'reason', 'repaymentPlan'],
            properties: {
              amount: { type: 'number', example: 25000 },
              reason: { type: 'string', example: 'Medical emergency support' },
              repaymentPlan: { type: 'string', example: 'Deduct over 5 salary cycles' },
              notes: { type: 'string', example: 'Requesting priority approval' }
            }
          })
        },
        responses: {
          201: response('Advance created', {
            type: 'object',
            properties: { message: { type: 'string' }, advance: { $ref: '#/components/schemas/AdvanceRequest' } }
          }),
          ...errorResponses
        }
      }
    },
    '/advances/{id}': {
      get: {
        tags: ['Advances'],
        summary: 'Get advance request detail, history, and activity log',
        security: authSecurity,
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          200: response('Advance detail', {
            type: 'object',
            properties: {
              advance: { $ref: '#/components/schemas/AdvanceRequest' },
              history: { type: 'array', items: { $ref: '#/components/schemas/AdvanceRequest' } },
              activityLog: { type: 'array', items: { $ref: '#/components/schemas/AuditLog' } }
            }
          }),
          ...errorResponses
        }
      }
    },
    '/advances/{id}/approve': {
      put: {
        tags: ['Advances'],
        summary: 'Approve advance request',
        security: authSecurity,
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: false,
          content: json({ type: 'object', properties: { note: { type: 'string', example: 'Approved as per company policy' } } })
        },
        responses: {
          200: response('Advance approved', {
            type: 'object',
            properties: { message: { type: 'string' }, advance: { $ref: '#/components/schemas/AdvanceRequest' } }
          }),
          ...errorResponses
        }
      }
    },
    '/advances/{id}/reject': {
      put: {
        tags: ['Advances'],
        summary: 'Reject advance request',
        security: authSecurity,
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['rejectionReason'],
            properties: { rejectionReason: { type: 'string', example: 'Policy limit exceeded for this cycle' } }
          })
        },
        responses: {
          200: response('Advance rejected', {
            type: 'object',
            properties: { message: { type: 'string' }, advance: { $ref: '#/components/schemas/AdvanceRequest' } }
          }),
          ...errorResponses
        }
      }
    },
    '/advances/{id}/pay': {
      put: {
        tags: ['Advances'],
        summary: 'Mark approved advance as paid',
        security: authSecurity,
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['paymentDate', 'paymentMode'],
            properties: {
              paymentDate: { type: 'string', format: 'date', example: '2026-06-12' },
              paymentMode: { type: 'string', enum: ['cash', 'bank', 'upi'], example: 'bank' },
              reference: { type: 'string', example: 'UTR123456789' }
            }
          })
        },
        responses: {
          200: response('Advance paid', {
            type: 'object',
            properties: { message: { type: 'string' }, advance: { $ref: '#/components/schemas/AdvanceRequest' } }
          }),
          ...errorResponses
        }
      }
    },

    '/payroll/summary': {
      get: {
        tags: ['Payroll'],
        summary: 'Get payroll summary',
        security: authSecurity,
        responses: {
          200: response('Payroll summary', {
            type: 'object',
            properties: {
              totalPayrolls: { type: 'number' },
              paidCount: { type: 'number' },
              draftCount: { type: 'number' },
              totalNetPay: { type: 'number' }
            }
          }),
          ...errorResponses
        }
      }
    },
    '/payroll': {
      get: {
        tags: ['Payroll'],
        summary: 'List payroll records',
        security: authSecurity,
        parameters: [
          { in: 'query', name: 'month', schema: { type: 'string', example: '2026-06' } },
          { in: 'query', name: 'user', schema: { type: 'string' }, description: 'Admin/HR/manager only filter' }
        ],
        responses: {
          200: response('Payroll records', {
            type: 'object',
            properties: { items: { type: 'array', items: { $ref: '#/components/schemas/PayrollRecord' } } }
          }),
          ...errorResponses
        }
      }
    },
    '/payroll/structures': {
      get: {
        tags: ['Payroll'],
        summary: 'List salary structures',
        security: authSecurity,
        responses: {
          200: response('Salary structures', {
            type: 'object',
            properties: { items: { type: 'array', items: { $ref: '#/components/schemas/SalaryStructure' } } }
          }),
          ...errorResponses
        }
      },
      post: {
        tags: ['Payroll'],
        summary: 'Create or update salary structure',
        security: authSecurity,
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['userId'],
            properties: {
              userId: { type: 'string' },
              basic: { type: 'number', example: 40000 },
              hra: { type: 'number', example: 16000 },
              allowances: { type: 'number', example: 9000 },
              statutoryDeductions: { type: 'number', example: 4500 },
              otherDeductions: { type: 'number', example: 1000 }
            }
          })
        },
        responses: {
          200: response('Structure saved', {
            type: 'object',
            properties: { message: { type: 'string' }, structure: { $ref: '#/components/schemas/SalaryStructure' } }
          }),
          ...errorResponses
        }
      }
    },
    '/payroll/run': {
      post: {
        tags: ['Payroll'],
        summary: 'Run payroll for a month',
        security: authSecurity,
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['month'],
            properties: {
              month: { type: 'string', example: '2026-06' },
              userId: { type: 'string', nullable: true, description: 'Optional user filter for a single employee' }
            }
          })
        },
        responses: {
          200: response('Payroll run completed', {
            type: 'object',
            properties: { message: { type: 'string' }, items: { type: 'array', items: { $ref: '#/components/schemas/PayrollRecord' } } }
          }),
          ...errorResponses
        }
      }
    },
    '/payroll/{id}/pay': {
      put: {
        tags: ['Payroll'],
        summary: 'Mark payroll record as paid',
        security: authSecurity,
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          200: response('Payroll marked paid', {
            type: 'object',
            properties: { message: { type: 'string' }, payroll: { $ref: '#/components/schemas/PayrollRecord' } }
          }),
          ...errorResponses
        }
      }
    },

    '/performance/summary': {
      get: {
        tags: ['Performance'],
        summary: 'Get performance summary',
        security: authSecurity,
        responses: {
          200: response('Performance summary', {
            type: 'object',
            properties: { totalReviews: { type: 'number' }, averageRating: { type: 'number' } }
          }),
          ...errorResponses
        }
      }
    },
    '/performance': {
      get: {
        tags: ['Performance'],
        summary: 'List performance reviews',
        security: authSecurity,
        parameters: [{ in: 'query', name: 'user', schema: { type: 'string' }, description: 'Optional admin/HR/manager filter' }],
        responses: {
          200: response('Performance review list', {
            type: 'object',
            properties: { items: { type: 'array', items: { $ref: '#/components/schemas/PerformanceReview' } } }
          }),
          ...errorResponses
        }
      },
      post: {
        tags: ['Performance'],
        summary: 'Create performance review',
        security: authSecurity,
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['userId', 'cycle', 'rating'],
            properties: {
              userId: { type: 'string' },
              cycle: { type: 'string', example: '2026 H1' },
              goals: { type: 'array', items: { type: 'string' } },
              rating: { type: 'number', minimum: 1, maximum: 5, example: 4.3 },
              feedback: { type: 'string', example: 'Strong ownership and delivery.' },
              status: { type: 'string', example: 'completed' }
            }
          })
        },
        responses: {
          201: response('Performance review created', {
            type: 'object',
            properties: { message: { type: 'string' }, review: { $ref: '#/components/schemas/PerformanceReview' } }
          }),
          ...errorResponses
        }
      }
    },

    '/reports/overview': {
      get: {
        tags: ['Reports'],
        summary: 'Get overview report across all modules',
        security: authSecurity,
        responses: {
          200: response('Overview report', { $ref: '#/components/schemas/OverviewReport' }),
          ...errorResponses
        }
      }
    },

    '/settings': {
      get: {
        tags: ['Settings'],
        summary: 'Get company settings',
        security: authSecurity,
        responses: {
          200: response('Current settings', {
            type: 'object',
            properties: { settings: { $ref: '#/components/schemas/CompanySettings' } }
          }),
          ...errorResponses
        }
      },
      put: {
        tags: ['Settings'],
        summary: 'Update company settings',
        security: authSecurity,
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            properties: {
              companyName: { type: 'string' },
              companyEmail: { type: 'string', format: 'email' },
              companyPhone: { type: 'string' },
              logoUrl: { type: 'string' },
              address: { type: 'string' },
              leaveTypes: { type: 'array', items: { type: 'string' } },
              holidays: { type: 'array', items: { type: 'string' } }
            }
          })
        },
        responses: {
          200: response('Settings updated', {
            type: 'object',
            properties: { message: { type: 'string' }, settings: { $ref: '#/components/schemas/CompanySettings' } }
          }),
          ...errorResponses
        }
      }
    },
    '/settings/form-options': {
      get: {
        tags: ['Settings'],
        summary: 'Get active roles and master data for dynamic form dropdowns',
        security: authSecurity,
        responses: {
          200: response('Form option payload', {
            type: 'object',
            properties: {
              roles: { type: 'array', items: { type: 'object', additionalProperties: true } },
              masterData: { type: 'object', additionalProperties: true }
            }
          }),
          ...errorResponses
        }
      }
    },
    '/settings/bundle': {
      get: {
        tags: ['Settings'],
        summary: 'Get full settings bundle with company settings, roles, categories, and grouped masters',
        security: authSecurity,
        responses: {
          200: response('Full settings bundle', {
            type: 'object',
            properties: {
              settings: { $ref: '#/components/schemas/CompanySettings' },
              roles: { type: 'array', items: { type: 'object', additionalProperties: true } },
              masterData: { type: 'object', additionalProperties: true },
              categories: { type: 'array', items: { type: 'string' } }
            }
          }),
          ...errorResponses
        }
      }
    },
    '/settings/roles': {
      get: {
        tags: ['Settings'],
        summary: 'List dynamic roles',
        security: authSecurity,
        responses: {
          200: response('Role list', { type: 'object', properties: { items: { type: 'array', items: { type: 'object', additionalProperties: true } } } }),
          ...errorResponses
        }
      },
      post: {
        tags: ['Settings'],
        summary: 'Create dynamic role',
        security: authSecurity,
        requestBody: {
          required: true,
          content: json({ type: 'object', required: ['label'], properties: { key: { type: 'string' }, label: { type: 'string' }, description: { type: 'string' }, isActive: { type: 'boolean' }, sortOrder: { type: 'number' } } })
        },
        responses: {
          201: response('Role created', { type: 'object', properties: { message: { type: 'string' }, role: { type: 'object', additionalProperties: true } } }),
          ...errorResponses
        }
      }
    },
    '/settings/roles/{id}': {
      put: {
        tags: ['Settings'],
        summary: 'Update dynamic role',
        security: authSecurity,
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: json({ type: 'object', properties: { key: { type: 'string' }, label: { type: 'string' }, description: { type: 'string' }, isActive: { type: 'boolean' }, sortOrder: { type: 'number' } } })
        },
        responses: {
          200: response('Role updated', { type: 'object', properties: { message: { type: 'string' }, role: { type: 'object', additionalProperties: true } } }),
          ...errorResponses
        }
      }
    },
    '/settings/masters': {
      get: {
        tags: ['Settings'],
        summary: 'List grouped master data or items by category',
        security: authSecurity,
        parameters: [{ in: 'query', name: 'category', schema: { type: 'string' } }],
        responses: {
          200: response('Master data list', { type: 'object', additionalProperties: true }),
          ...errorResponses
        }
      },
      post: {
        tags: ['Settings'],
        summary: 'Create master data item',
        security: authSecurity,
        requestBody: {
          required: true,
          content: json({ type: 'object', required: ['category', 'label'], properties: { category: { type: 'string' }, key: { type: 'string' }, label: { type: 'string' }, description: { type: 'string' }, isActive: { type: 'boolean' }, sortOrder: { type: 'number' }, metadata: { type: 'object', additionalProperties: true } } })
        },
        responses: {
          201: response('Master item created', { type: 'object', properties: { message: { type: 'string' }, item: { type: 'object', additionalProperties: true } } }),
          ...errorResponses
        }
      }
    },
    '/settings/masters/{id}': {
      put: {
        tags: ['Settings'],
        summary: 'Update master data item',
        security: authSecurity,
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: json({ type: 'object', properties: { category: { type: 'string' }, key: { type: 'string' }, label: { type: 'string' }, description: { type: 'string' }, isActive: { type: 'boolean' }, sortOrder: { type: 'number' }, metadata: { type: 'object', additionalProperties: true } } })
        },
        responses: {
          200: response('Master item updated', { type: 'object', properties: { message: { type: 'string' }, item: { type: 'object', additionalProperties: true } } }),
          ...errorResponses
        }
      }
    },

    '/permissions/my': {
      get: {
        tags: ['Permissions'],
        summary: 'Get effective permissions for current user',
        security: authSecurity,
        responses: {
          200: response('Current user permissions', {
            type: 'object',
            properties: {
              role: { type: 'string', example: 'hr' },
              permissions: { type: 'object', additionalProperties: true }
            }
          }),
          ...errorResponses
        }
      }
    },
    '/permissions/meta': {
      get: {
        tags: ['Permissions'],
        summary: 'Get permission metadata (roles, actions, modules)',
        security: authSecurity,
        responses: {
          200: response('Permission metadata', {
            type: 'object',
            properties: {
              roles: { type: 'array', items: { type: 'string' } },
              actions: { type: 'array', items: { type: 'string' } },
              modules: { type: 'array', items: { type: 'object', additionalProperties: true } }
            }
          }),
          ...errorResponses
        }
      }
    },
    '/permissions/audit-logs': {
      get: {
        tags: ['Permissions'],
        summary: 'Get recent permission-related audit logs',
        security: authSecurity,
        parameters: [{ in: 'query', name: 'limit', schema: { type: 'number', default: 20, maximum: 100 } }],
        responses: {
          200: response('Permission audit logs', {
            type: 'object',
            properties: { items: { type: 'array', items: { $ref: '#/components/schemas/AuditLog' } } }
          }),
          ...errorResponses
        }
      }
    },
    '/permissions/roles': {
      get: {
        tags: ['Permissions'],
        summary: 'Get full role permission matrix and recent logs',
        security: authSecurity,
        responses: {
          200: response('Role permission matrix', {
            type: 'object',
            properties: {
              meta: { type: 'object', additionalProperties: true },
              permissionsByRole: { type: 'object', additionalProperties: true },
              auditLogs: { type: 'array', items: { $ref: '#/components/schemas/AuditLog' } }
            }
          }),
          ...errorResponses
        }
      }
    },
    '/permissions/roles/{role}': {
      get: {
        tags: ['Permissions'],
        summary: 'Get permissions for a single role',
        security: authSecurity,
        parameters: [{ in: 'path', name: 'role', required: true, schema: { type: 'string', enum: ['admin', 'hr', 'manager', 'employee'] } }],
        responses: {
          200: response('Role permission map', {
            type: 'object',
            properties: {
              role: { type: 'string' },
              locked: { type: 'boolean' },
              permissions: { type: 'object', additionalProperties: true }
            }
          }),
          ...errorResponses
        }
      }
    },
    '/permissions/roles/{role}/modules/{module}': {
      put: {
        tags: ['Permissions'],
        summary: 'Replace enabled/sidebar/actions for one role-module pair',
        security: authSecurity,
        parameters: [
          { in: 'path', name: 'role', required: true, schema: { type: 'string', enum: ['admin', 'hr', 'manager', 'employee'] } },
          { in: 'path', name: 'module', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['enabled', 'showInSidebar', 'actions'],
            properties: {
              enabled: { type: 'boolean', example: true },
              showInSidebar: { type: 'boolean', example: true },
              actions: { type: 'array', items: { type: 'string' }, example: ['view', 'create', 'edit'] }
            }
          })
        },
        responses: {
          200: response('Role-module permissions updated', {
            type: 'object',
            properties: {
              message: { type: 'string' },
              permission: { type: 'object', additionalProperties: true }
            }
          }),
          ...errorResponses
        }
      }
    },
    '/permissions/roles/{role}/modules/{module}/actions/{action}': {
      patch: {
        tags: ['Permissions'],
        summary: 'Toggle one action for a role-module pair',
        security: authSecurity,
        parameters: [
          { in: 'path', name: 'role', required: true, schema: { type: 'string', enum: ['admin', 'hr', 'manager', 'employee'] } },
          { in: 'path', name: 'module', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'action', required: true, schema: { type: 'string', enum: ['view', 'create', 'edit', 'delete', 'approve', 'export'] } }
        ],
        requestBody: {
          required: true,
          content: json({ type: 'object', required: ['enabled'], properties: { enabled: { type: 'boolean', example: true } } })
        },
        responses: {
          200: response('Action toggled', {
            type: 'object',
            properties: { message: { type: 'string' }, permission: { type: 'object', additionalProperties: true } }
          }),
          ...errorResponses
        }
      }
    },
    '/permissions/roles/{role}/modules/{module}/sidebar': {
      patch: {
        tags: ['Permissions'],
        summary: 'Update sidebar visibility for a role-module pair',
        security: authSecurity,
        parameters: [
          { in: 'path', name: 'role', required: true, schema: { type: 'string', enum: ['admin', 'hr', 'manager', 'employee'] } },
          { in: 'path', name: 'module', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: json({ type: 'object', required: ['showInSidebar'], properties: { showInSidebar: { type: 'boolean', example: true } } })
        },
        responses: {
          200: response('Sidebar visibility updated', {
            type: 'object',
            properties: { message: { type: 'string' }, permission: { type: 'object', additionalProperties: true } }
          }),
          ...errorResponses
        }
      }
    },
    '/permissions/bulk-update': {
      put: {
        tags: ['Permissions'],
        summary: 'Bulk update all module permissions for a role',
        security: authSecurity,
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['role', 'permissions'],
            properties: {
              role: { type: 'string', enum: ['admin', 'hr', 'manager', 'employee'], example: 'hr' },
              permissions: { type: 'object', additionalProperties: true }
            }
          })
        },
        responses: {
          200: response('Bulk permissions updated', {
            type: 'object',
            properties: {
              message: { type: 'string' },
              items: { type: 'array', items: { type: 'object', additionalProperties: true } }
            }
          }),
          ...errorResponses
        }
      }
    },

    '/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'List my notifications',
        security: authSecurity,
        parameters: [{ in: 'query', name: 'limit', schema: { type: 'number', default: 10, maximum: 50 } }],
        responses: {
          200: response('Notifications list', {
            type: 'object',
            properties: {
              items: { type: 'array', items: { $ref: '#/components/schemas/Notification' } },
              unreadCount: { type: 'number' }
            }
          }),
          ...errorResponses
        }
      }
    },
    '/notifications/unread-count': {
      get: {
        tags: ['Notifications'],
        summary: 'Get unread notification count',
        security: authSecurity,
        responses: {
          200: response('Unread count', {
            type: 'object',
            properties: { unreadCount: { type: 'number' } }
          }),
          ...errorResponses
        }
      }
    },
    '/notifications/read-all': {
      put: {
        tags: ['Notifications'],
        summary: 'Mark all notifications as read',
        security: authSecurity,
        responses: { 200: messageResponse('All notifications marked as read'), ...errorResponses }
      }
    },
    '/notifications/{id}/read': {
      put: {
        tags: ['Notifications'],
        summary: 'Mark one notification as read',
        security: authSecurity,
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          200: response('Notification marked as read', {
            type: 'object',
            properties: {
              message: { type: 'string' },
              notification: { $ref: '#/components/schemas/Notification' }
            }
          }),
          ...errorResponses
        }
      }
    },

    '/audit-logs': {
      get: {
        tags: ['Audit'],
        summary: 'List audit logs',
        security: authSecurity,
        parameters: [
          { in: 'query', name: 'entityType', schema: { type: 'string' } },
          { in: 'query', name: 'action', schema: { type: 'string' } },
          { in: 'query', name: 'limit', schema: { type: 'number', default: 100, maximum: 250 } }
        ],
        responses: {
          200: response('Audit log list', {
            type: 'object',
            properties: { items: { type: 'array', items: { $ref: '#/components/schemas/AuditLog' } } }
          }),
          ...errorResponses
        }
      }
    }
  }
};
