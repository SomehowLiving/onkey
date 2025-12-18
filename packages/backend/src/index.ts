import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { logger } from './utils/logger.js';
import { initEmail } from './services/email.js';
import { authenticate } from './utils/auth.js';
import { authRoutes } from './routes/auth.js';
import { mpcRoutes } from './routes/mpc.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'ENCRYPTION_KEY',
  'EMAIL_HOST',
  'EMAIL_USER',
  'EMAIL_PASS',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error({ envVar }, 'Missing required environment variable');
    process.exit(1);
  }
}

// Initialize email service
initEmail({
  host: process.env.EMAIL_HOST!,
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  user: process.env.EMAIL_USER!,
  pass: process.env.EMAIL_PASS!,
  from: process.env.EMAIL_FROM || 'auth@onkey.dev',
});

// Create Fastify instance
// const fastify = Fastify({
//   logger: logger.child({ service: 'backend' }),
// });
const fastify = Fastify({
  loggerInstance: logger.child({ service: 'backend' })
});

// Register plugins
await fastify.register(helmet);
await fastify.register(cors, {
  origin: true,
  credentials: true,
});

// Register authentication decorator
fastify.decorate('authenticate', authenticate);

// Register routes
await fastify.register(authRoutes, { prefix: '/auth' });
await fastify.register(mpcRoutes, { prefix: '/mpc' });

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
try {
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  logger.info({ port: PORT }, 'Backend server started');
} catch (err) {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
}

// Types are declared in src/types/fastify.d.ts


