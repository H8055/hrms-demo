// Central configuration for the Employee Profile module:
//  - document catalogue (groups + sub-types)
//  - category-level access control (who can see OTHERS' docs of a category)
//  - the versioned, weighted field registry that drives profile completion %

// ---------------------------------------------------------------------------
// Document catalogue
// ---------------------------------------------------------------------------
export const DOCUMENT_CATEGORIES = ['employment', 'salary', 'kyc', 'general'];

export const DOCUMENT_CATALOGUE = {
  employment: {
    label: 'Employment & Letters',
    subTypes: [
      'offer-letter',
      'appointment-letter',
      'employment-contract',
      'confirmation-letter',
      'transfer-letter',
      'promotion-letter',
      'increment-letter',
      'salary-revision-letter',
      'experience-letter',
      'relieving-letter',
      'warning-letter',
      'show-cause-notice',
      'appreciation-letter',
      'appreciation-certificate'
    ]
  },
  salary: {
    label: 'Salary & Payroll',
    subTypes: [
      'salary-slip',
      'annual-salary-statement',
      'form-16',
      'bonus-letter',
      'incentive-letter',
      'salary-advance'
    ]
  },
  kyc: {
    label: 'KYC',
    subTypes: [
      'aadhaar',
      'pan',
      'passport',
      'voter-id',
      'driving-license',
      'address-proof',
      'bank-passbook',
      'cancelled-cheque',
      'sslc-certificate',
      'puc-certificate',
      'degree-certificate',
      'professional-certification',
      'previous-experience',
      'previous-relieving'
    ]
  },
  general: {
    label: 'General',
    subTypes: ['general']
  }
};

// Sub-types that carry an expiry date we should remind about
export const EXPIRING_SUBTYPES = ['passport', 'driving-license', 'employment-contract', 'professional-certification'];

// Sub-types whose document number is a regulated identifier and must be masked
export const SENSITIVE_NUMBER_SUBTYPES = ['aadhaar', 'pan', 'passport', 'voter-id', 'driving-license'];

// ---------------------------------------------------------------------------
// Category-level access control
// Roles listed here may access OTHER employees' documents in that category.
// An employee can ALWAYS access their own documents regardless of this map.
// ---------------------------------------------------------------------------
export const CATEGORY_ROLE_ACCESS = {
  employment: ['admin', 'hr', 'manager'],
  salary: ['admin', 'hr', 'accounts'],
  kyc: ['admin', 'hr'],
  general: ['admin', 'hr', 'manager']
};

export function canAccessCategory(role, category, isOwner) {
  if (isOwner) return true;
  const allowed = CATEGORY_ROLE_ACCESS[category] || [];
  return allowed.includes(role);
}

// Returns the list of categories a (non-owner) role may view — used to filter
// document lists for roles like "accounts" that only see salary docs.
export function visibleCategoriesForRole(role) {
  return DOCUMENT_CATEGORIES.filter((category) => (CATEGORY_ROLE_ACCESS[category] || []).includes(role));
}

// ---------------------------------------------------------------------------
// Profile completion field registry (versioned + weighted)
//
// Bump `version` whenever you add/remove a field. The completion engine
// recomputes every profile against the new version; anyone previously at 100%
// drops proportionally and is notified to complete the new field.
//
// Field kinds:
//   'user'     -> truthy check on User[key]
//   'nested'   -> truthy check on a dotted path, e.g. bankDetails.accountNumber
//   'document' -> a current, non-rejected EmployeeDocument matching category+subType
// ---------------------------------------------------------------------------
export const FIELD_REGISTRY = {
  version: 1,
  fields: [
    { key: 'photoUrl', label: 'Profile photo', weight: 1, kind: 'user', path: 'photoUrl' },
    { key: 'phone', label: 'Phone number', weight: 1, kind: 'user', path: 'phone' },
    { key: 'address', label: 'Address', weight: 1, kind: 'user', path: 'address' },
    { key: 'dateOfBirth', label: 'Date of birth', weight: 1, kind: 'user', path: 'dateOfBirth' },
    { key: 'gender', label: 'Gender', weight: 1, kind: 'user', path: 'gender' },
    { key: 'emergencyContactName', label: 'Emergency contact name', weight: 1, kind: 'user', path: 'emergencyContactName' },
    { key: 'emergencyContactPhone', label: 'Emergency contact phone', weight: 1, kind: 'user', path: 'emergencyContactPhone' },
    { key: 'bankAccount', label: 'Bank account number', weight: 2, kind: 'nested', path: 'bankDetails.accountNumber' },
    { key: 'bankIfsc', label: 'Bank IFSC', weight: 1, kind: 'nested', path: 'bankDetails.ifsc' },
    { key: 'doc-pan', label: 'PAN card', weight: 2, kind: 'document', category: 'kyc', subType: 'pan' },
    { key: 'doc-aadhaar', label: 'Aadhaar card', weight: 2, kind: 'document', category: 'kyc', subType: 'aadhaar' },
    { key: 'doc-bank', label: 'Bank proof', weight: 1, kind: 'document', category: 'kyc', subType: 'bank-passbook' },
    { key: 'doc-degree', label: 'Education certificate', weight: 1, kind: 'document', category: 'kyc', subType: 'degree-certificate' }
  ]
};

export function totalRegistryWeight() {
  return FIELD_REGISTRY.fields.reduce((sum, field) => sum + (field.weight || 1), 0);
}
