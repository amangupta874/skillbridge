import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const demoPassword = process.env.DEMO_PASSWORD;
const demoDomain = '@demo.skillbridge.test';

const userDefinitions = [
  {
    email: `owner${demoDomain}`, fullName: 'Avery Morgan', college: 'Demo University',
    bio: 'I enjoy building useful student tools.', weeklyHours: 8,
    skills: [['React', 'ADVANCED'], ['Node.js', 'INTERMEDIATE']], goals: ['Python'], interests: ['EdTech', 'Startups'],
  },
  {
    email: `maya${demoDomain}`, fullName: 'Maya Chen', college: 'Demo University',
    bio: 'I like data projects and learning frontend skills.', weeklyHours: 6,
    skills: [['Python', 'ADVANCED'], ['HTML', 'INTERMEDIATE']], goals: ['React'], interests: ['Data Science', 'Open Source'],
  },
  {
    email: `leo${demoDomain}`, fullName: 'Leo Patel', college: 'Demo College',
    bio: 'I am learning backend development.', weeklyHours: 5,
    skills: [['JavaScript', 'INTERMEDIATE'], ['Python', 'BEGINNER']], goals: ['Node.js'], interests: ['Hackathons', 'Web Development'],
  },
  {
    email: `sam${demoDomain}`, fullName: 'Sam Rivera', college: 'Demo College',
    bio: 'I build APIs and experiment with databases.', weeklyHours: 10,
    skills: [['Node.js', 'ADVANCED'], ['PostgreSQL', 'INTERMEDIATE']], goals: ['JavaScript'], interests: ['SaaS', 'AI Tools'],
  },
  {
    email: `ivy${demoDomain}`, fullName: 'Ivy Brooks', college: 'Demo University',
    bio: 'I care about accessible and clear interfaces.', weeklyHours: 7,
    skills: [['React', 'BEGINNER'], ['JavaScript', 'INTERMEDIATE']], goals: ['PostgreSQL'], interests: ['Design and UX', 'HealthTech'],
  },
  {
    email: `noah${demoDomain}`, fullName: 'Noah Kim', college: 'Demo College',
    bio: 'I enjoy small full stack projects.', weeklyHours: 9,
    skills: [['Python', 'INTERMEDIATE'], ['HTML', 'ADVANCED']], goals: ['React'], interests: ['Mobile Apps', 'Social Impact'],
  },
];

function checkEnvironment() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED_IN_PRODUCTION !== 'yes') {
    throw new Error('Demo seeding in production requires ALLOW_DEMO_SEED_IN_PRODUCTION=yes');
  }
  if (!demoPassword || demoPassword.length < 8 || demoPassword.length > 72 || !/[A-Za-z]/.test(demoPassword) || !/[0-9]/.test(demoPassword)) {
    throw new Error('DEMO_PASSWORD is required and must be 8 to 72 characters with a letter and a digit');
  }
}

async function findSkills(client, names) {
  const savedSkills = await client.skill.findMany({ where: { name: { in: [...new Set(names)] } }, select: { id: true, name: true } });
  const skills = new Map(savedSkills.map((skill) => [skill.name, skill.id]));
  const missing = names.filter((name) => !skills.has(name));
  if (missing.length) throw new Error(`Catalogue is missing skills: ${[...new Set(missing)].join(', ')}. Run db:seed first.`);
  return skills;
}

async function clearOldDemoData(tx) {
  const oldUsers = await tx.user.findMany({ where: { email: { endsWith: demoDomain } }, select: { id: true } });
  const userIds = oldUsers.map(({ id }) => id);
  if (!userIds.length) return;

  // These relations do not all cascade from users in the schema.
  await tx.projectApplication.deleteMany({ where: { applicantId: { in: userIds } } });
  await tx.projectMember.deleteMany({ where: { userId: { in: userIds } } });
  await tx.project.deleteMany({ where: { ownerId: { in: userIds } } });
  await tx.skillExchange.deleteMany({ where: { OR: [{ senderId: { in: userIds } }, { recipientId: { in: userIds } }] } });
  await tx.user.deleteMany({ where: { id: { in: userIds } } });
}

async function getLookups(tx, skillNames) {
  const colleges = new Map();
  for (const name of ['Demo University', 'Demo College']) {
    const college = await tx.college.upsert({ where: { name }, update: {}, create: { name } });
    colleges.set(name, college.id);
  }

  const categories = new Map();
  for (const name of ['Web Development', 'Data Science', 'Design and UX']) {
    const category = await tx.projectCategory.upsert({ where: { name }, update: {}, create: { name } });
    categories.set(name, category.id);
  }

  const interests = new Map();
  for (const name of [...new Set(userDefinitions.flatMap(({ interests: userInterests }) => userInterests))]) {
    const interest = await tx.interest.upsert({ where: { name }, update: {}, create: { name } });
    interests.set(name, interest.id);
  }
  return { colleges, categories, interests, skills: await findSkills(tx, skillNames) };
}

async function createProject(tx, ownerId, categoryId, title, status, maxTeamSize, skillNames, skillIds) {
  const project = await tx.project.create({
    data: {
      ownerId,
      categoryId,
      title,
      description: `${title} gives students a shared project to build and learn together.`,
      difficulty: 'INTERMEDIATE',
      status,
      maxTeamSize,
      hoursPerWeek: 6,
    },
  });
  await tx.projectSkill.createMany({
    data: skillNames.map((name, index) => ({ projectId: project.id, skillId: skillIds.get(name), minLevel: index === 0 ? 'INTERMEDIATE' : 'BEGINNER' })),
  });
  return project;
}

async function createApplication(tx, projectId, applicantId, status, message) {
  const application = await tx.projectApplication.create({
    data: { projectId, applicantId, status, message, ...(status !== 'PENDING' && { decidedAt: new Date() }) },
  });
  const project = await tx.project.findUnique({ where: { id: projectId }, select: { ownerId: true } });
  await tx.notification.create({ data: { recipientId: project.ownerId, type: 'APPLICATION_RECEIVED', applicationId: application.id } });
  if (status === 'ACCEPTED' || status === 'REJECTED') {
    await tx.notification.create({
      data: { recipientId: applicantId, type: status === 'ACCEPTED' ? 'APPLICATION_ACCEPTED' : 'APPLICATION_REJECTED', applicationId: application.id },
    });
  }
  return application;
}

async function seedDemo() {
  checkEnvironment();
  const passwordHash = await bcrypt.hash(demoPassword, 12);
  const allSkillNames = [
    ...userDefinitions.flatMap(({ skills, goals }) => [...skills.map(([name]) => name), ...goals]),
    'HTML', 'PostgreSQL', 'JavaScript', 'React', 'Node.js', 'Python',
  ];

  await prisma.$transaction(async (tx) => {
    await clearOldDemoData(tx);
    const lookups = await getLookups(tx, allSkillNames);
    const users = new Map();
    for (const definition of userDefinitions) {
      const user = await tx.user.create({
        data: {
          email: definition.email,
          passwordHash,
          fullName: definition.fullName,
          bio: definition.bio,
          weeklyHours: definition.weeklyHours,
          collegeId: lookups.colleges.get(definition.college),
        },
      });
      users.set(definition.email, user.id);
      await tx.userSkill.createMany({
        data: definition.skills.map(([name, level]) => ({ userId: user.id, skillId: lookups.skills.get(name), level })),
      });
      await tx.userLearningGoal.createMany({
        data: definition.goals.map((name) => ({ userId: user.id, skillId: lookups.skills.get(name) })),
      });
      await tx.userInterest.createMany({
        data: definition.interests.map((name) => ({ userId: user.id, interestId: lookups.interests.get(name) })),
      });
    }

    const id = (email) => users.get(`${email}${demoDomain}`);
    const ownerId = id('owner');
    const lastSeat = await createProject(
      tx, ownerId, lookups.categories.get('Web Development'), 'Demo: Last Seat Challenge', 'OPEN', 2,
      ['React', 'Node.js'], lookups.skills,
    );
    await createApplication(tx, lastSeat.id, id('maya'), 'PENDING', 'I can help build the interface and test the learning flow.');
    await createApplication(tx, lastSeat.id, id('leo'), 'PENDING', 'I would like to help with the API and learn React.');

    const acceptedProject = await createProject(
      tx, id('maya'), lookups.categories.get('Data Science'), 'Demo: Campus Data Explorer', 'OPEN', 3,
      ['Python', 'PostgreSQL'], lookups.skills,
    );
    await createApplication(tx, acceptedProject.id, id('sam'), 'ACCEPTED', 'I can work on the data API and queries.');
    await tx.projectMember.create({ data: { projectId: acceptedProject.id, userId: id('sam') } });
    await createApplication(tx, acceptedProject.id, id('noah'), 'REJECTED', 'I have time to help with data visualisation.');

    await createProject(tx, id('leo'), lookups.categories.get('Web Development'), 'Demo: Study Group Planner', 'IN_PROGRESS', 4, ['JavaScript', 'React'], lookups.skills);
    await createProject(tx, id('sam'), lookups.categories.get('Design and UX'), 'Demo: Portfolio Refresh', 'DRAFT', 3, ['HTML', 'React'], lookups.skills);
    await createProject(tx, id('ivy'), lookups.categories.get('Web Development'), 'Demo: Completed Study Board', 'COMPLETED', 4, ['JavaScript', 'Node.js'], lookups.skills);

    const pendingExchange = await tx.skillExchange.create({
      data: {
        senderId: id('maya'), recipientId: id('ivy'), offeredSkillId: lookups.skills.get('Python'),
        requestedSkillId: lookups.skills.get('React'), message: 'I can help you learn Python if you show me React.', status: 'PENDING',
      },
    });
    await tx.notification.create({ data: { recipientId: id('ivy'), type: 'EXCHANGE_RECEIVED', exchangeId: pendingExchange.id } });

    const acceptedExchange = await tx.skillExchange.create({
      data: {
        senderId: id('sam'), recipientId: id('noah'), offeredSkillId: lookups.skills.get('Node.js'),
        requestedSkillId: lookups.skills.get('Python'), message: 'I can trade Node.js help for Python tips.', status: 'ACCEPTED',
      },
    });
    await tx.notification.create({ data: { recipientId: id('noah'), type: 'EXCHANGE_RECEIVED', exchangeId: acceptedExchange.id } });
    await tx.notification.create({ data: { recipientId: id('sam'), type: 'EXCHANGE_ACCEPTED', exchangeId: acceptedExchange.id } });
  });
}

try {
  await seedDemo();
  for (const { email } of userDefinitions) process.stdout.write(`${email}\n`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
