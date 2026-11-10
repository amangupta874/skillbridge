import express from 'express';
import { prisma } from './config/prisma.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { lookupsRoutes } from './modules/lookups/lookups.routes.js';
import { skillsRoutes } from './modules/skills/skills.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';

export const apiRouter = express.Router();

apiRouter.get('/health', async (req, res) => {
  await prisma.$queryRaw`SELECT 1`; // proves the database is reachable
  res.json({ data: { status: 'ok' } });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/lookups', lookupsRoutes);
apiRouter.use('/skills', skillsRoutes);
apiRouter.use('/users', usersRoutes);
