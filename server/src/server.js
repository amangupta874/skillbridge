import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './config/prisma.js';
import { cleanupExpiredSessions } from './utils/sessionCleanup.js';

function runSessionCleanup() {
  cleanupExpiredSessions().catch((error) => logger.error({ err: error }, 'Session cleanup failed'));
}

runSessionCleanup();
const sessionCleanupTimer = setInterval(runSessionCleanup, 6 * 60 * 60 * 1000);
sessionCleanupTimer.unref();

const server = app.listen(env.PORT, () => logger.info(`API listening on port ${env.PORT}`));

function shutdown(signal) {
  logger.info({ signal }, 'Shutting down');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
  process.exit(1); // the host restarts the process
});
process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception');
  process.exit(1);
});
