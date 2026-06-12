import mongoose from 'mongoose';

const payrollRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    month: {
      type: String,
      required: true,
      index: true
    },
    grossPay: {
      type: Number,
      default: 0
    },
    statutoryDeductions: {
      type: Number,
      default: 0
    },
    otherDeductions: {
      type: Number,
      default: 0
    },
    advanceDeduction: {
      type: Number,
      default: 0
    },
    totalDeductions: {
      type: Number,
      default: 0
    },
    netPay: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['draft', 'paid'],
      default: 'draft'
    },
    paidAt: {
      type: Date,
      default: null
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
);

payrollRecordSchema.index({ user: 1, month: 1 }, { unique: true });

export const PayrollRecord = mongoose.model('PayrollRecord', payrollRecordSchema);
