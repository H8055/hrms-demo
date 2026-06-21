import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { swaggerSpec } from './config/swagger.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');

const allowedOrigins = new Set([
  env.frontendUrl,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175'
]);

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);
app.use(compression());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.has(origin);
      const isLocalDevOrigin = /^https?:\/\/(localhost|127\.0\.0\.1):(5\d{3})$/.test(origin);

      if (isAllowed || (env.nodeEnv !== 'production' && isLocalDevOrigin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
// Employee documents are confidential — block direct static access so they can
// only be retrieved through the authenticated download route (which enforces
// category-level ACL and writes an access audit log). Other uploads (e.g. the
// company logo) remain publicly served.
app.use('/uploads/employee-documents', (req, res) => {
  res.status(403).json({ message: 'Access to employee documents requires authentication' });
});
app.use('/uploads', express.static(uploadsDir));

app.get('/', (req, res) => {
  res.json({
    message: 'HRMS API is running',
    docs: `http://localhost:${env.port}/api/docs`,
    health: `http://localhost:${env.port}/api/health`
  });
});

app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      tryItOutEnabled: true,
      docExpansion: 'list'
    },
    customSiteTitle: 'HRMS API Docs'
  })
);
app.use('/api', routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
