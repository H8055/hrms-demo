import mongoose from 'mongoose';

export const DOCUMENT_STATUSES = ['pending', 'verified', 'rejected'];

const employeeDocumentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    // Top-level group: employment | salary | kyc | general
    category: {
      type: String,
      trim: true,
      default: 'general',
      index: true
    },
    // Specific document type within the group, e.g. 'aadhaar', 'offer-letter'
    subType: {
      type: String,
      trim: true,
      default: ''
    },
    originalName: {
      type: String,
      required: true
    },
    storedName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      default: 'application/octet-stream'
    },
    size: {
      type: Number,
      default: 0
    },
    relativePath: {
      type: String,
      required: true
    },
    // Storage backend that holds the file: 'local' now, 'spaces' (DigitalOcean) later
    storageProvider: {
      type: String,
      trim: true,
      default: 'local'
    },
    // Sensitive identifier (Aadhaar/PAN/passport no.) — stored masked
    documentNumber: {
      type: String,
      trim: true,
      default: ''
    },
    issueDate: {
      type: Date,
      default: null
    },
    expiryDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: DOCUMENT_STATUSES,
      default: 'pending',
      index: true
    },
    remarks: {
      type: String,
      trim: true,
      default: ''
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    // Replace-with-history support
    version: {
      type: Number,
      default: 1
    },
    isCurrent: {
      type: Boolean,
      default: true,
      index: true
    },
    // Set when this document was produced by the auto letter generator
    generatedLetter: {
      type: Boolean,
      default: false
    },
    // Last time an expiry reminder notification was sent (dedup guard)
    expiryReminderSentAt: {
      type: Date,
      default: null
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
);

employeeDocumentSchema.index({ user: 1, category: 1, subType: 1, isCurrent: 1 });

export const EmployeeDocument = mongoose.model('EmployeeDocument', employeeDocumentSchema);
