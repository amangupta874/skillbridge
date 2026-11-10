import { prisma } from '../../config/prisma.js';

export function searchSkills({ query, categoryId, limit }) {
  const textFilter = query
    ? { OR: [
      { name: { contains: query, mode: 'insensitive' } },
      { aliases: { some: { alias: { contains: query.toLowerCase() } } } },
    ] }
    : {};

  return prisma.skill.findMany({
    where: { ...(categoryId && { categoryId }), ...textFilter },
    select: { id: true, name: true, category: { select: { id: true, name: true } } },
    orderBy: { name: 'asc' },
    take: limit,
  });
}
