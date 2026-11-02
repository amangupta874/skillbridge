// Run with: npm run db:seed --workspace server   (safe to run many times: uses upsert)
import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const catalogue = JSON.parse(fs.readFileSync(new URL('./seed-data/catalogue.json', import.meta.url), 'utf8'));

async function seedSkills() {
  for (const category of catalogue.skillCategories) {
    const savedCategory = await prisma.skillCategory.upsert({
      where: { name: category.name }, update: {}, create: { name: category.name },
    });
    for (const skill of category.skills) {
      const savedSkill = await prisma.skill.upsert({
        where: { name: skill.name }, update: {}, create: { name: skill.name, categoryId: savedCategory.id },
      });
      for (const alias of skill.aliases) {
        await prisma.skillAlias.upsert({
          where: { alias: alias.toLowerCase() }, update: {}, create: { alias: alias.toLowerCase(), skillId: savedSkill.id },
        });
      }
    }
  }
}

async function seedSimpleLookups() {
  for (const name of catalogue.projectCategories) {
    await prisma.projectCategory.upsert({ where: { name }, update: {}, create: { name } });
  }
  for (const name of catalogue.interests) {
    await prisma.interest.upsert({ where: { name }, update: {}, create: { name } });
  }
  for (const name of catalogue.colleges) {
    await prisma.college.upsert({ where: { name }, update: {}, create: { name } });
  }
}

try {
  await seedSkills();
  await seedSimpleLookups();
  console.log('Catalogue seeded.');
} finally {
  await prisma.$disconnect();
}
