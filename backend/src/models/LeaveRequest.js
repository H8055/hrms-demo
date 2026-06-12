import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    leaveType: {
      type: String,
      enum: ['annual', 'sick', 'casual', 'unpaid'],
      required: true
    },
    fromDate: {
      type: Date,
      required: true
    },
    toDate: {
      type: Date,
      required: true
    },
    days: {
      type: Number,
      required: true,
      min: 1
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true
    },
    managerComment: {
      type: String,
      default: ''
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    decidedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

export const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);
