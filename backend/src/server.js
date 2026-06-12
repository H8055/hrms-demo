import app from './app.js';
import { env } from './config/env.js';
import { connectDb } from './config/db.js';
import { seedDefaultRolePermissions } from './services/permission.service.js';

async function bootstrap() {
  try {
    await connectDb();
    await seedDefaultRolePermissions();
    app.listen(env.port, () => {
      console.log(`API listening on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

bootstrap();
