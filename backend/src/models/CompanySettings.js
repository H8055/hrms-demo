import mongoose from 'mongoose';

const companySettingsSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      default: 'My Company'
    },
    companyEmail: {
      type: String,
      default: ''
    },
    companyPhone: {
      type: String,
      default: ''
    },
    logoUrl: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      default: ''
    },
    leaveTypes: {
      type: [String],
      default: ['annual', 'sick', 'casual', 'unpaid']
    },
    holidays: {
      type: [String],
      default: []
    },
    advanceWorkflow: {
      approvalDepartments: {
        type: [String],
        default: ['Human Resources']
      },
      payoutDepartments: {
        type: [String],
        default: ['Accounts']
      }
    }
  },
  { timestamps: true }
);

export const CompanySettings = mongoose.model('CompanySettings', companySettingsSchema);
