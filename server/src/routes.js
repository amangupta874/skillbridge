import express from 'express';
import { prisma } from './config/prisma.js';
import { authRoutes } from './modules/auth/auth.routes.js';

export const apiRouter = express.Router();

apiRouter.get('/health', async (req, res) => {
  await prisma.$queryRaw`SELECT 1`; // proves the database is reachable
  res.json({ data: { status: 'ok' } });
});

apiRouter.use('/auth', authRoutes);
