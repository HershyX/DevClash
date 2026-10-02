import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import { env } from './config/env.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import problemRoutes from './routes/problemRoutes.js';
import battleRoutes from './routes/battleRoutes.js';
import adaptiveRoutes from './routes/adaptiveRoutes.js';
import classroomRoutes from './routes/classroomRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

export function createApp() {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS restricted to configured client origins
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || env.clientOrigins.includes(origin) || env.clientOrigins.includes('*')) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
    })
  );

  // Body parsing with sane size limits
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Strip $ and . keys from body/query (NoSQL injection defense)
  app.use(mongoSanitize());

  // Request logging
  if (!env.isTest) {
    app.use(morgan(env.isProd ? 'combined' : 'dev'));
  }

  // Health check (no auth, no rate limit) — useful for scripts and uptime probes
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
  });

  // API surface
  app.use('/api', apiLimiter);
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/problems', problemRoutes);
  app.use('/api/battles', battleRoutes);
  app.use('/api/adaptive', adaptiveRoutes);
  app.use('/api/classrooms', classroomRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/notifications', notificationRoutes);

  // 404 then centralized error handler
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
