import mongoose from 'mongoose';
import { ACTION_KEYS, MODULE_KEYS } from '../config/permissions.js';

const rolePermissionSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    module: {
      type: String,
      enum: MODULE_KEYS,
      required: true,
      index: true
    },
    enabled: {
      type: Boolean,
      default: true
    },
    showInSidebar: {
      type: Boolean,
      default: true
    },
    actions: {
      type: [String],
      enum: ACTION_KEYS,
      default: []
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
);

rolePermissionSchema.index({ role: 1, module: 1 }, { unique: true });

export const RolePermission = mongoose.model('RolePermission', rolePermissionSchema);
