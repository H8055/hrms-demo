import app from './app.js';
import { env } from './config/env.js';
import { connectDb } from './config/db.js';
import { seedDefaultMasterData } from './services/master-data.service.js';
import { seedDefaultRolePermissions } from './services/permission.service.js';
import { seedDefaultRoles } from './services/role.service.js';
import { seedDefaultLetterTemplates } from './services/letter-template.service.js';
import { startExpiryReminderJob } from './services/reminder.service.js';

async function bootstrap() {
  try {
    await connectDb();
    await seedDefaultRoles();
    await seedDefaultMasterData();
    await seedDefaultRolePermissions();
    await seedDefaultLetterTemplates();
    startExpiryReminderJob();
    app.listen(env.port, () => {
      console.log(`API listening on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

bootstrap();
