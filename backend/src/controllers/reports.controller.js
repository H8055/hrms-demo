import { AdvanceRequest } from '../models/AdvanceRequest.js';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { PayrollRecord } from '../models/PayrollRecord.js';
import { PerformanceReview } from '../models/PerformanceReview.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getOverviewReport = asyncHandler(async (req, res) => {
  const [employees, attendance, leaves, payrolls, advances, reviews] = await Promise.all([
    User.countDocuments(),
    AttendanceRecord.find(),
    LeaveRequest.find(),
    PayrollRecord.find(),
    AdvanceRequest.find(),
    PerformanceReview.find()
  ]);

  res.json({
    employees,
    attendance: {
      total: attendance.length,
      present: attendance.filter((item) => item.status === 'present').length,
      onLeave: attendance.filter((item) => item.status === 'on-leave').length,
      pendingRegularization: attendance.filter((item) => item.status === 'regularization-pending').length
    },
    leaves: {
      total: leaves.length,
      pending: leaves.filter((item) => item.status === 'pending').length,
      approved: leaves.filter((item) => item.status === 'approved').length
    },
    payroll: {
      total: payrolls.length,
      paid: payrolls.filter((item) => item.status === 'paid').length,
      totalNetPay: payrolls.reduce((sum, item) => sum + item.netPay, 0)
    },
    advances: {
      total: advances.length,
      pending: advances.filter((item) => item.status === 'pending').length,
      paid: advances.filter((item) => item.status === 'paid').length,
      totalDisbursed: advances.filter((item) => item.status === 'paid').reduce((sum, item) => sum + item.amount, 0)
    },
    performance: {
      totalReviews: reviews.length,
      averageRating: reviews.length ? Number((reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length).toFixed(2)) : 0
    }
  });
});
