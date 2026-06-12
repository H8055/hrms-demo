import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    checkIn: {
      type: Date,
      default: null
    },
    checkOut: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'half-day', 'on-leave', 'regularization-pending'],
      default: 'present'
    },
    source: {
      type: String,
      enum: ['self', 'manual', 'system'],
      default: 'self'
    },
    regularization: {
      requestedAt: { type: Date, default: null },
      reason: { type: String, default: '' },
      requestedCheckIn: { type: Date, default: null },
      requestedCheckOut: { type: Date, default: null },
      status: {
        type: String,
        enum: ['', 'pending', 'approved', 'rejected'],
        default: ''
      },
      decisionComment: { type: String, default: '' },
      decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      decidedAt: { type: Date, default: null }
    }
  },
  { timestamps: true }
);

attendanceRecordSchema.index({ user: 1, date: 1 }, { unique: true });

export const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);
