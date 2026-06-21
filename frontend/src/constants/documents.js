// Mirrors backend src/config/employeeProfile.js document catalogue, with
// display labels for the UI selectors.
export const DOCUMENT_GROUPS = [
  {
    key: 'kyc',
    label: 'KYC',
    subTypes: [
      { key: 'aadhaar', label: 'Aadhaar Card' },
      { key: 'pan', label: 'PAN Card' },
      { key: 'passport', label: 'Passport' },
      { key: 'voter-id', label: 'Voter ID' },
      { key: 'driving-license', label: 'Driving License' },
      { key: 'address-proof', label: 'Address Proof' },
      { key: 'bank-passbook', label: 'Bank Passbook' },
      { key: 'cancelled-cheque', label: 'Cancelled Cheque' },
      { key: 'sslc-certificate', label: 'SSLC Certificate' },
      { key: 'puc-certificate', label: 'PUC Certificate' },
      { key: 'degree-certificate', label: 'Degree Certificate' },
      { key: 'professional-certification', label: 'Professional Certification' },
      { key: 'previous-experience', label: 'Previous Experience Certificate' },
      { key: 'previous-relieving', label: 'Previous Relieving Letter' }
    ]
  },
  {
    key: 'employment',
    label: 'Employment & Letters',
    subTypes: [
      { key: 'offer-letter', label: 'Offer Letter' },
      { key: 'appointment-letter', label: 'Appointment Letter' },
      { key: 'employment-contract', label: 'Employment Contract' },
      { key: 'confirmation-letter', label: 'Confirmation Letter' },
      { key: 'transfer-letter', label: 'Transfer Letter' },
      { key: 'promotion-letter', label: 'Promotion Letter' },
      { key: 'increment-letter', label: 'Increment Letter' },
      { key: 'salary-revision-letter', label: 'Salary Revision Letter' },
      { key: 'experience-letter', label: 'Experience Letter' },
      { key: 'relieving-letter', label: 'Relieving Letter' },
      { key: 'warning-letter', label: 'Warning Letter' },
      { key: 'show-cause-notice', label: 'Show Cause Notice' },
      { key: 'appreciation-letter', label: 'Appreciation Letter' },
      { key: 'appreciation-certificate', label: 'Appreciation Certificate' }
    ]
  },
  {
    key: 'salary',
    label: 'Salary & Payroll',
    subTypes: [
      { key: 'salary-slip', label: 'Salary Slip' },
      { key: 'annual-salary-statement', label: 'Annual Salary Statement' },
      { key: 'form-16', label: 'Form 16' },
      { key: 'bonus-letter', label: 'Bonus Letter' },
      { key: 'incentive-letter', label: 'Incentive Letter' },
      { key: 'salary-advance', label: 'Salary Advance' }
    ]
  },
  {
    key: 'general',
    label: 'General',
    subTypes: [{ key: 'general', label: 'General Document' }]
  }
];

export const SUBTYPE_LABELS = DOCUMENT_GROUPS.reduce((acc, group) => {
  group.subTypes.forEach((sub) => {
    acc[sub.key] = sub.label;
  });
  return acc;
}, {});

export const CATEGORY_LABELS = DOCUMENT_GROUPS.reduce((acc, group) => {
  acc[group.key] = group.label;
  return acc;
}, {});

// Fields an employee may submit for self-service update (HR approval required).
export const SELF_EDITABLE_FIELDS = [
  { key: 'phone', label: 'Phone' },
  { key: 'address', label: 'Address' },
  { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
  { key: 'gender', label: 'Gender' },
  { key: 'bloodGroup', label: 'Blood Group' },
  { key: 'maritalStatus', label: 'Marital Status' },
  { key: 'emergencyContactName', label: 'Emergency Contact Name' },
  { key: 'emergencyContactPhone', label: 'Emergency Contact Phone' },
  { key: 'bankDetails.accountName', label: 'Bank Account Name' },
  { key: 'bankDetails.accountNumber', label: 'Bank Account Number' },
  { key: 'bankDetails.ifsc', label: 'Bank IFSC' }
];
