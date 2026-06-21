import mongoose from 'mongoose';

// HR-editable HTML templates for auto-generated letters. Placeholders such as
// {{employee.name}} or {{custom.salary}} are merged at generation time.
const letterTemplateSchema = new mongoose.Schema(
  {
    // Stable key, e.g. 'offer-letter', 'experience-letter' — maps to a document subType
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    // HTML body with {{placeholders}}
    body: {
      type: String,
      required: true
    },
    // Extra fields HR must fill in at generation time (beyond employee data),
    // e.g. [{ key: 'salary', label: 'Annual CTC' }]
    customFields: {
      type: [
        {
          key: { type: String, trim: true },
          label: { type: String, trim: true }
        }
      ],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
);

export const LetterTemplate = mongoose.model('LetterTemplate', letterTemplateSchema);
