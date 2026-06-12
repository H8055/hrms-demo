import mongoose from 'mongoose';

const salaryStructureSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    basic: {
      type: Number,
      default: 0
    },
    hra: {
      type: Number,
      default: 0
    },
    allowances: {
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
    }
  },
  { timestamps: true }
);

export const SalaryStructure = mongoose.model('SalaryStructure', salaryStructureSchema);
