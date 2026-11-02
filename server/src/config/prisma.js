import { PrismaClient } from '@prisma/client';

// One shared client for the whole process.
export const prisma = new PrismaClient();
