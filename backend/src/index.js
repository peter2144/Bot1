import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import pinoHttp from 'pino-http';
import { initializeDatabase } from './config/database.js';
import { initializeRedis } from './config/redis.js';
import authRoutes from './routes/auth.routes.js';
import sessionRoutes from './routes/session.routes.js';
import chatRoutes from './routes/chat.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const frontendUrl = process.env.FRONTEND_URL || 'https://bot1-kz5u-4h1ohddxh-wa-bot1.vercel.app';

app.use(helmet());
app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(pinoHttp({ logger }));

app.get('/', (_req, res) => {
  res.json({
    name: 'Whatsapp Bot Backend',
    status: 'running',
    health: '/health',
    api: {
      auth: '/api/auth',
      session: '/api/session',
      chat: '/api/chat',
      settings: '/api/settings'
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    database: !!process.env.DATABASE_URL,
    redis: !!process.env.REDIS_URL,
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/settings', settingsRoutes);

app.use(errorHandler);

async function start() {
  try {
    if (process.env.DATABASE_URL) {
      await initializeDatabase();
    } else {
      logger.warn('DATABASE_URL not set. Skipping database initialization.');
    }

    if (process.env.REDIS_URL) {
      await initializeRedis();
    } else {
      logger.warn('REDIS_URL not set. Skipping Redis initialization.');
    }

    logger.info(`API listening on port ${PORT}`);
    app.listen(PORT);
  } catch (error) {
    logger.error('Failed to start API', error);
    process.exit(1);
  }
}

start();

export default app;
