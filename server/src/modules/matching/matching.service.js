import { prisma } from '../../config/prisma.js';
import { forbidden, notFound } from '../../utils/errors.js';
import { scoreCandidate } from './scoreCandidate.js';

const levelRank = { ADVANCED: 0, INTERMEDIATE: 1, BEGINNER: 2 };

function toUserCard(user) {
  const topSkills = [...user.skills]
    .sort((left, right) => levelRank[left.level] - levelRank[right.level] || left.skill.name.localeCompare(right.skill.name))
    .slice(0, 3)
    .map(({ skill, level }) => ({ skill, level }));
  return { id: user.id, fullName: user.fullName, college: user.college, topSkills };
}

export async function getMatchesForProject({ projectId, ownerId, limit }) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      ownerId: true,
      skills: { select: { skillId: true, minLevel: true, skill: { select: { name: true } } } },
      members: { select: { userId: true } },
    },
  });
  if (!project) throw notFound('Project not found');
  if (project.ownerId !== ownerId) throw forbidden('Only the project owner can view matches');

  const requiredSkills = project.skills.map(({ skillId, minLevel, skill }) => ({ skillId, name: skill.name, minLevel }));
  if (requiredSkills.length === 0) return [];

  const teamUserIds = [project.ownerId, ...project.members.map(({ userId }) => userId)];
  const teamSkills = await prisma.userSkill.findMany({
    where: { userId: { in: teamUserIds } },
    select: { skillId: true },
  });
  const requiredSkillIds = requiredSkills.map(({ skillId }) => skillId);
  const [knownByCandidates, wantedByCandidates] = await Promise.all([
    prisma.userSkill.findMany({
      where: { skillId: { in: requiredSkillIds }, userId: { notIn: teamUserIds } },
      select: { userId: true },
    }),
    prisma.userLearningGoal.findMany({
      where: { skillId: { in: requiredSkillIds }, userId: { notIn: teamUserIds } },
      select: { userId: true },
    }),
  ]);
  const candidateIds = [...new Set([
    ...knownByCandidates.map(({ userId }) => userId),
    ...wantedByCandidates.map(({ userId }) => userId),
  ])].slice(0, 200);
  if (candidateIds.length === 0) return [];

  const candidates = await prisma.user.findMany({
    where: { id: { in: candidateIds } },
    select: {
      id: true,
      fullName: true,
      college: { select: { id: true, name: true } },
      skills: { select: { skillId: true, level: true, skill: { select: { id: true, name: true } } } },
      learningGoals: { select: { skillId: true } },
    },
  });

  const teamSkillIds = new Set(teamSkills.map(({ skillId }) => skillId));
  return candidates.map((candidate) => {
    const score = scoreCandidate({
      requiredSkills,
      candidateSkills: candidate.skills,
      candidateGoalSkillIds: candidate.learningGoals.map(({ skillId }) => skillId),
      teamSkillIds,
    });
    return { user: toUserCard(candidate), ...score };
  })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.user.fullName.localeCompare(right.user.fullName))
    .slice(0, limit);
}
