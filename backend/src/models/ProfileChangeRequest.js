import mongoose from 'mongoose';

export const CHANGE_REQUEST_STATUSES = ['pending', 'approved', 'rejected'];

// Self-service edits to personal info / KYC are queued here for HR approval
// rather than written to the User directly — full governance + audit trail.
const profileChangeRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // Proposed field -> new value map, e.g. { phone: '...', 'bankDetails.ifsc': '...' }
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    // Snapshot of the previous values for the same keys (for audit/diff display)
    previousValues: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    note: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: CHANGE_REQUEST_STATUSES,
      default: 'pending',
      index: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    reviewNote: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { timestamps: true }
);

export const ProfileChangeRequest = mongoose.model('ProfileChangeRequest', profileChangeRequestSchema);
