import { LetterTemplate } from '../models/LetterTemplate.js';

// Default HTML letter templates seeded once. HR can edit them in Settings.
const DEFAULT_TEMPLATES = [
  {
    key: 'offer-letter',
    name: 'Offer Letter',
    customFields: [
      { key: 'salary', label: 'Annual CTC' },
      { key: 'startDate', label: 'Proposed start date' }
    ],
    body: `<h2>Offer of Employment</h2>
<p>Dear {{employee.name}},</p>
<p>We are pleased to offer you the position of <strong>{{employee.designation}}</strong> in the {{employee.department}} department at {{company.name}}.</p>
<p>Your annual compensation will be <strong>{{custom.salary}}</strong>. Your proposed date of joining is {{custom.startDate}}.</p>
<p>We look forward to welcoming you to the team.</p>
<div class="signature"><p>Warm regards,</p><p>Human Resources<br/>{{company.name}}</p></div>`
  },
  {
    key: 'appointment-letter',
    name: 'Appointment Letter',
    customFields: [{ key: 'salary', label: 'Annual CTC' }],
    body: `<h2>Letter of Appointment</h2>
<p>Dear {{employee.name}},</p>
<p>With reference to your application, we are happy to confirm your appointment as <strong>{{employee.designation}}</strong> ({{employee.department}}) at {{company.name}}, effective {{employee.joiningDate}}.</p>
<p>Your annual compensation is <strong>{{custom.salary}}</strong>. You will report to {{employee.manager}}.</p>
<div class="signature"><p>For {{company.name}}</p><p>Human Resources</p></div>`
  },
  {
    key: 'confirmation-letter',
    name: 'Confirmation Letter',
    customFields: [],
    body: `<h2>Confirmation of Employment</h2>
<p>Dear {{employee.name}},</p>
<p>We are pleased to confirm your services as <strong>{{employee.designation}}</strong> with {{company.name}} with effect from {{today}}, following the successful completion of your probation period.</p>
<div class="signature"><p>For {{company.name}}</p><p>Human Resources</p></div>`
  },
  {
    key: 'promotion-letter',
    name: 'Promotion Letter',
    customFields: [
      { key: 'newDesignation', label: 'New designation' },
      { key: 'effectiveDate', label: 'Effective date' }
    ],
    body: `<h2>Promotion Letter</h2>
<p>Dear {{employee.name}},</p>
<p>In recognition of your performance and contribution, we are pleased to promote you to the position of <strong>{{custom.newDesignation}}</strong>, effective {{custom.effectiveDate}}.</p>
<p>Congratulations and we wish you continued success.</p>
<div class="signature"><p>For {{company.name}}</p><p>Human Resources</p></div>`
  },
  {
    key: 'increment-letter',
    name: 'Increment Letter',
    customFields: [
      { key: 'newSalary', label: 'Revised annual CTC' },
      { key: 'effectiveDate', label: 'Effective date' }
    ],
    body: `<h2>Salary Increment Letter</h2>
<p>Dear {{employee.name}},</p>
<p>We are pleased to inform you that your annual compensation has been revised to <strong>{{custom.newSalary}}</strong>, effective {{custom.effectiveDate}}.</p>
<p>This revision reflects our appreciation of your performance.</p>
<div class="signature"><p>For {{company.name}}</p><p>Human Resources</p></div>`
  },
  {
    key: 'warning-letter',
    name: 'Warning Letter',
    customFields: [{ key: 'reason', label: 'Reason / incident' }],
    body: `<h2>Warning Letter</h2>
<p>Dear {{employee.name}},</p>
<p>This letter serves as a formal warning regarding the following: {{custom.reason}}.</p>
<p>You are advised to take corrective action immediately. Failure to do so may result in further disciplinary action.</p>
<div class="signature"><p>For {{company.name}}</p><p>Human Resources</p></div>`
  },
  {
    key: 'experience-letter',
    name: 'Experience Letter',
    customFields: [{ key: 'lastWorkingDay', label: 'Last working day' }],
    body: `<h2>Experience Certificate</h2>
<p>This is to certify that {{employee.name}} ({{employee.employeeCode}}) was employed with {{company.name}} as <strong>{{employee.designation}}</strong> in the {{employee.department}} department from {{employee.joiningDate}} to {{custom.lastWorkingDay}}.</p>
<p>During the tenure, the employee's conduct and performance were found to be satisfactory. We wish them success in their future endeavours.</p>
<div class="signature"><p>For {{company.name}}</p><p>Human Resources</p></div>`
  },
  {
    key: 'relieving-letter',
    name: 'Relieving Letter',
    customFields: [{ key: 'lastWorkingDay', label: 'Last working day' }],
    body: `<h2>Relieving Letter</h2>
<p>Dear {{employee.name}},</p>
<p>This is to confirm that you have been relieved from your duties as <strong>{{employee.designation}}</strong> at {{company.name}} with effect from the close of business on {{custom.lastWorkingDay}}.</p>
<p>We thank you for your contribution and wish you the best.</p>
<div class="signature"><p>For {{company.name}}</p><p>Human Resources</p></div>`
  }
];

export async function seedDefaultLetterTemplates() {
  for (const template of DEFAULT_TEMPLATES) {
    await LetterTemplate.updateOne(
      { key: template.key },
      { $setOnInsert: { ...template, isActive: true } },
      { upsert: true }
    );
  }
}
