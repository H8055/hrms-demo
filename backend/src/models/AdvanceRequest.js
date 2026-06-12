import mongoose from 'mongoose';

const advanceRequestSchema = new mongoose.Schema(
  {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 1
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    repaymentPlan: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'paid'],
      default: 'pending',
      index: true
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    adminNote: {
      type: String,
      default: ''
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    rejectedAt: {
      type: Date,
      default: null
    },
    paidAt: {
      type: Date,
      default: null
    },
    paymentMode: {
      type: String,
      enum: ['', 'cash', 'bank', 'upi'],
      default: ''
    },
    reference: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

export const AdvanceRequest = mongoose.model('AdvanceRequest', advanceRequestSchema);
