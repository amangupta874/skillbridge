import request from 'supertest';
import { prisma } from '../src/config/prisma.js';
import { app } from '../src/app.js';

const ALL_TABLES = ['notifications', 'skill_exchanges', 'project_members', 'project_applications', 'project_skills', 'projects',
  'user_interests', 'user_learning_goals', 'user_skills', 'user_links', 'sessions', 'skill_aliases', 'skills', 'skill_categories',
  'interests', 'project_categories', 'users', 'colleges'];

export async function resetDatabase() {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${ALL_TABLES.map((table) => `"${table}"`).join(', ')} RESTART IDENTITY CASCADE`);
}

let userCounter = 0;

export async function registerUser(overrides = {}) {
  userCounter += 1;
  const credentials = {
    fullName: `Test User ${userCounter}`,
    email: `user${userCounter}@example.com`,
    password: 'Password123',
    ...overrides,
  };
  const agent = request.agent(app);
  const response = await agent.post('/api/auth/register').send(credentials);
  return { agent, user: response.body.data, credentials };
}

export async function createSkill(name, categoryName = 'Test Category') {
  const category = await prisma.skillCategory.upsert({
    where: { name: categoryName },
    update: {},
    create: { name: categoryName },
  });
  return prisma.skill.upsert({
    where: { name },
    update: {},
    create: { name, categoryId: category.id },
  });
}

export async function createProjectCategory(name = 'Web Development') {
  return prisma.projectCategory.upsert({ where: { name }, update: {}, create: { name } });
}
