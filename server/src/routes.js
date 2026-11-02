import express from 'express';
import { prisma } from './config/prisma.js';

export const apiRouter = express.Router();

apiRouter.get('/health', async (req, res) => {
  await prisma.$queryRaw`SELECT 1`; // proves the database is reachable
  res.json({ data: { status: 'ok' } });
});

// Mount each module router here as it is built, for example:
// apiRouter.use('/auth', authRoutes);
