import { EmployeeDocument } from '../models/EmployeeDocument.js';
import { User } from '../models/User.js';
import { createNotification } from './notification.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const REMINDER_WINDOW_DAYS = 30;
const REMINDER_REPEAT_DAYS = 7;

// Notifies the employee and HR about documents expiring within the window.
// Re-runs are de-duplicated via expiryReminderSentAt so we remind at most once
// per REMINDER_REPEAT_DAYS while a document stays in the window.
export async function sendExpiryReminders(now = new Date()) {
  const horizon = new Date(now.getTime() + REMINDER_WINDOW_DAYS * DAY_MS);
  const repeatCutoff = new Date(now.getTime() - REMINDER_REPEAT_DAYS * DAY_MS);

  const documents = await EmployeeDocument.find({
    isCurrent: true,
    expiryDate: { $ne: null, $lte: horizon },
    $or: [{ expiryReminderSentAt: null }, { expiryReminderSentAt: { $lte: repeatCutoff } }]
  }).populate('user', 'name');

  if (documents.length === 0) return { reminded: 0 };

  const hrUsers = await User.find({ role: { $in: ['hr', 'admin'] }, isActive: true }).select('_id');

  let reminded = 0;
  for (const doc of documents) {
    if (!doc.user) continue;
    const expired = doc.expiryDate < now;
    const days = Math.ceil((doc.expiryDate - now) / DAY_MS);
    const label = doc.subType || doc.category;

    await createNotification({
      recipient: doc.user._id,
      type: 'document.expiry',
      title: expired ? 'Document expired' : 'Document expiring soon',
      message: expired
        ? `Your ${label} has expired. Please upload a renewed copy.`
        : `Your ${label} expires in ${days} day(s). Please upload a renewed copy.`,
      link: '/profile',
      relatedEntityType: 'EmployeeDocument',
      relatedEntityId: doc._id
    });

    await Promise.all(
      hrUsers.map((hr) =>
        createNotification({
          recipient: hr._id,
          type: 'document.expiry',
          title: expired ? 'Employee document expired' : 'Employee document expiring',
          message: `${doc.user.name}'s ${label} ${expired ? 'has expired' : `expires in ${days} day(s)`}.`,
          link: `/employees`,
          relatedEntityType: 'EmployeeDocument',
          relatedEntityId: doc._id
        })
      )
    );

    doc.expiryReminderSentAt = now;
    await doc.save();
    reminded += 1;
  }

  return { reminded };
}

// Runs the check on boot and then daily.
export function startExpiryReminderJob() {
  const run = () => {
    sendExpiryReminders().catch((error) => console.error('Expiry reminder job failed', error));
  };
  run();
  return setInterval(run, DAY_MS);
}
