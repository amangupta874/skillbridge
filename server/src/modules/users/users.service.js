import { prisma } from '../../config/prisma.js';
import { badRequest, notFound } from '../../utils/errors.js';

const userPublicSelect = {
  id: true,
  fullName: true,
  bio: true,
  weeklyHours: true,
  createdAt: true,
  college: { select: { id: true, name: true } },
  links: { select: { type: true, url: true }, orderBy: { type: 'asc' } },
  interests: { select: { interest: { select: { id: true, name: true } } }, orderBy: { interestId: 'asc' } },
  skills: {
    select: {
      level: true,
      skill: { select: { id: true, name: true, category: { select: { id: true, name: true } } } },
    },
    orderBy: { skill: { name: 'asc' } },
  },
  learningGoals: { select: { skill: { select: { id: true, name: true } } }, orderBy: { skillId: 'asc' } },
};

const levelRank = { ADVANCED: 0, INTERMEDIATE: 1, BEGINNER: 2 };

function toUserPublic(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    bio: user.bio,
    weeklyHours: user.weeklyHours,
    college: user.college,
    links: user.links,
    skills: user.skills,
    learningGoals: user.learningGoals.map(({ skill }) => skill),
    interests: user.interests.map(({ interest }) => interest),
    createdAt: user.createdAt,
  };
}

function toUserCard(user) {
  const topSkills = [...user.skills]
    .sort((left, right) => levelRank[left.level] - levelRank[right.level] || left.skill.name.localeCompare(right.skill.name))
    .slice(0, 3);

  return {
    id: user.id,
    fullName: user.fullName,
    college: user.college,
    topSkills,
  };
}

async function getUserPublic(userId, client = prisma) {
  const user = await client.user.findUnique({ where: { id: userId }, select: userPublicSelect });
  if (!user) throw notFound('User not found');
  return toUserPublic(user);
}

export async function getPublicProfile(userId) {
  return getUserPublic(userId);
}

export async function listUsers(callerId, { query, skillId, page, limit }) {
  const where = {
    id: { not: callerId },
    ...(query && { fullName: { contains: query, mode: 'insensitive' } }),
    ...(skillId && { skills: { some: { skillId } } }),
  };
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        college: { select: { id: true, name: true } },
        skills: { select: { level: true, skill: { select: { id: true, name: true } } } },
      },
      orderBy: [{ fullName: 'asc' }, { id: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { users: users.map(toUserCard), page, limit, total };
}

export async function updateProfile(userId, input) {
  return prisma.$transaction(async (tx) => {
    if (input.collegeId !== undefined && input.collegeId !== null) {
      const college = await tx.college.findUnique({ where: { id: input.collegeId }, select: { id: true } });
      if (!college) throw badRequest('College does not exist');
    }

    if (input.interestIds) {
      const interests = await tx.interest.findMany({ where: { id: { in: input.interestIds } }, select: { id: true } });
      if (interests.length !== input.interestIds.length) throw badRequest('One or more interests do not exist');
    }

    const { links, interestIds, ...profileFields } = input;
    await tx.user.update({ where: { id: userId }, data: profileFields });

    if (links) {
      await tx.userLink.deleteMany({ where: { userId } });
      if (links.length) await tx.userLink.createMany({ data: links.map((link) => ({ ...link, userId })) });
    }

    if (interestIds) {
      await tx.userInterest.deleteMany({ where: { userId } });
      if (interestIds.length) {
        await tx.userInterest.createMany({ data: interestIds.map((interestId) => ({ userId, interestId })) });
      }
    }

    return getUserPublic(userId, tx);
  });
}

async function validateSkills(skillIds, client) {
  const skills = await client.skill.findMany({ where: { id: { in: skillIds } }, select: { id: true } });
  if (skills.length !== skillIds.length) throw badRequest('One or more skills do not exist');
}

export async function updateSkills(userId, skills) {
  return prisma.$transaction(async (tx) => {
    const skillIds = skills.map((skill) => skill.skillId);
    await validateSkills(skillIds, tx);

    const goals = await tx.userLearningGoal.findMany({
      where: { userId, skillId: { in: skillIds } },
      select: { skillId: true },
    });
    if (goals.length) throw badRequest('A skill cannot be both known and a learning goal');

    await tx.userSkill.deleteMany({ where: { userId } });
    if (skills.length) {
      await tx.userSkill.createMany({ data: skills.map((skill) => ({ ...skill, userId })) });
    }

    return getUserPublic(userId, tx);
  });
}

export async function updateLearningGoals(userId, skillIds) {
  return prisma.$transaction(async (tx) => {
    await validateSkills(skillIds, tx);

    const knownSkills = await tx.userSkill.findMany({
      where: { userId, skillId: { in: skillIds } },
      select: { skillId: true },
    });
    if (knownSkills.length) throw badRequest('A skill cannot be both known and a learning goal');

    await tx.userLearningGoal.deleteMany({ where: { userId } });
    if (skillIds.length) {
      await tx.userLearningGoal.createMany({ data: skillIds.map((skillId) => ({ userId, skillId })) });
    }

    return getUserPublic(userId, tx);
  });
}
