import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      default: 'employee'
    },
    department: {
      type: String,
      trim: true,
      default: ''
    },
    designation: {
      type: String,
      trim: true,
      default: ''
    },
    employeeCode: {
      type: String,
      trim: true,
      default: ''
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    joiningDate: {
      type: Date,
      default: null
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    employmentStatus: {
      type: String,
      trim: true,
      default: 'active'
    },
    emergencyContactName: {
      type: String,
      trim: true,
      default: ''
    },
    emergencyContactPhone: {
      type: String,
      trim: true,
      default: ''
    },
    leaveBalances: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        annual: 18,
        sick: 8,
        casual: 6
      }
    },
    bankDetails: {
      accountName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifsc: { type: String, default: '' }
    },
    currentSalary: {
      type: Number,
      default: 0
    },
    location: {
      type: String,
      trim: true,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    refreshToken: {
      type: String,
      default: null
    },
    resetTokenHash: {
      type: String,
      default: null
    },
    resetTokenExpiresAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
