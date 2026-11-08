import { prisma } from '../../config/prisma.js';

export async function getLookups() {
  const [projectCategories, skillCategories, interests, colleges] = await Promise.all([
    prisma.projectCategory.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.skillCategory.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.interest.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.college.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);

  return { projectCategories, skillCategories, interests, colleges };
}
