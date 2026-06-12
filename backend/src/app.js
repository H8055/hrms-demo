import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { swaggerSpec } from "./config/swagger.js";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

const allowedOrigins = new Set([
  env.frontendUrl,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.has(origin);
      const isLocalDevOrigin =
        /^https?:\/\/(localhost|127\.0\.0\.1):(5\d{3})$/.test(origin);

      if (isAllowed || (env.nodeEnv !== "production" && isLocalDevOrigin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    message: "HRMS API is running",
    docs: `http://localhost:${env.port}/api/docs`,
    health: `http://localhost:${env.port}/api/health`,
  });
});

app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      tryItOutEnabled: true,
      docExpansion: "list",
    },
    customSiteTitle: "HRMS API Docs",
  }),
);
app.use("/api", routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
