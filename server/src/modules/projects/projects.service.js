import { prisma } from '../../config/prisma.js';
import { badRequest, conflict, forbidden, notFound } from '../../utils/errors.js';
import { getAllowedTransitions, PROJECT_TRANSITIONS } from './transitions.js';

const projectInclude = {
  category: { select: { id: true, name: true } },
  owner: { select: { id: true, fullName: true } },
  skills: { select: { skillId: true, minLevel: true, skill: { select: { id: true, name: true } } }, orderBy: { skillId: 'asc' } },
  members: { select: { userId: true, joinedAt: true, user: { select: { fullName: true } } }, orderBy: { joinedAt: 'asc' } },
  _count: { select: { members: true } },
};

function toProjectListItem(project) {
  const seatsTaken = 1 + project._count.members;
  return {
    id: project.id,
    title: project.title,
    summary: project.description.slice(0, 200),
    category: project.category,
    difficulty: project.difficulty,
    status: project.status,
    maxTeamSize: project.maxTeamSize,
    seatsTaken,
    seatsLeft: project.maxTeamSize - seatsTaken,
    isFull: seatsTaken >= project.maxTeamSize,
    skills: project.skills.map(({ skill, minLevel }) => ({ ...skill, minLevel })),
    owner: project.owner,
    createdAt: project.createdAt,
  };
}

function toProjectDetail(project, callerId, myApplication) {
  return {
    ...toProjectListItem(project),
    description: project.description,
    hoursPerWeek: project.hoursPerWeek,
    deadline: project.deadline,
    githubUrl: project.githubUrl,
    demoUrl: project.demoUrl,
    members: project.members.map(({ userId, joinedAt, user }) => ({ id: userId, fullName: user.fullName, joinedAt })),
    myRole: project.ownerId === callerId ? 'OWNER' : project.members.some(({ userId }) => userId === callerId) ? 'MEMBER' : 'NONE',
    myApplication: myApplication ? { id: myApplication.id, status: myApplication.status } : null,
  };
}

async function getProjectDetail(project, callerId, client = prisma) {
  const myApplication = await client.projectApplication.findUnique({
    where: { projectId_applicantId: { projectId: project.id, applicantId: callerId } },
    select: { id: true, status: true },
  });
  return toProjectDetail(project, callerId, myApplication);
}

async function validateProjectSkills(skills, client) {
  const skillIds = skills.map(({ skillId }) => skillId);
  const foundSkills = await client.skill.findMany({ where: { id: { in: skillIds } }, select: { id: true } });
  const foundIds = new Set(foundSkills.map(({ id }) => id));
  const unknownIds = skillIds.filter((id) => !foundIds.has(id));
  if (unknownIds.length) throw badRequest('One or more skills do not exist', { skillIds: unknownIds });
}

export async function createProject(ownerId, input) {
  await validateProjectSkills(input.skills, prisma);
  const { skills, ...fields } = input;
  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: { ...fields, ownerId, status: input.status ?? 'DRAFT' },
    });
    await tx.projectSkill.createMany({ data: skills.map((skill) => ({ ...skill, projectId: created.id })) });
    return tx.project.findUnique({ where: { id: created.id }, include: projectInclude });
  });
  return getProjectDetail(project, ownerId);
}

export async function getProject(projectId, callerId) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, include: projectInclude });
  if (!project || (project.status === 'DRAFT' && project.ownerId !== callerId)) throw notFound('Project not found');
  return getProjectDetail(project, callerId);
}

export async function updateProject(projectId, callerId, input) {
  const current = await prisma.project.findUnique({
    where: { id: projectId },
    include: { ...projectInclude, _count: { select: { members: true } } },
  });
  if (!current) throw notFound('Project not found');
  if (current.ownerId !== callerId) throw forbidden('Only the project owner can edit this project');

  const { skills, status, ...fields } = input;
  const hasFields = Object.keys(fields).length > 0 || skills !== undefined;
  if (['COMPLETED', 'ARCHIVED'].includes(current.status) && hasFields) {
    throw conflict('This project can only be archived');
  }
  if (status !== undefined && !getAllowedTransitions(PROJECT_TRANSITIONS, current.status).includes(status)) {
    throw conflict('This project status change is not allowed');
  }
  if (fields.maxTeamSize !== undefined && fields.maxTeamSize < 1 + current._count.members) {
    throw conflict('Maximum team size cannot be smaller than the current team');
  }

  const project = await prisma.$transaction(async (tx) => {
    if (skills) await validateProjectSkills(skills, tx);
    await tx.project.update({ where: { id: projectId }, data: { ...fields, ...(status !== undefined && { status }) } });
    if (skills) {
      await tx.projectSkill.deleteMany({ where: { projectId } });
      await tx.projectSkill.createMany({ data: skills.map((skill) => ({ ...skill, projectId })) });
    }
    return tx.project.findUnique({ where: { id: projectId }, include: projectInclude });
  });
  return getProjectDetail(project, callerId);
}

export async function listProjects(callerId, input) {
  const skillIds = input.skillIds ? input.skillIds.split(',').map(Number) : [];
  const owned = input.mine === 'owned';
  const where = {
    ...(input.mine === 'owned' && { ownerId: callerId }),
    ...(input.mine === 'member' && { members: { some: { userId: callerId } } }),
    ...(!owned && { status: input.status ?? 'OPEN' }),
    ...(owned && input.status && { status: input.status }),
    ...(input.categoryId && { categoryId: input.categoryId }),
    ...(input.difficulty && { difficulty: input.difficulty }),
    ...(input.query && { OR: [
      { title: { contains: input.query, mode: 'insensitive' } },
      { description: { contains: input.query, mode: 'insensitive' } },
    ] }),
    ...(skillIds.length && { skills: { some: { skillId: { in: skillIds } } } }),
  };

  if (input.hasOpenSeats || input.sort === 'seats') {
    const projects = await prisma.project.findMany({ where, include: projectInclude, take: 500 });
    const filtered = input.hasOpenSeats
      ? projects.filter((project) => project.maxTeamSize - 1 - project._count.members > 0)
      : projects;
    if (input.sort === 'oldest') filtered.sort((a, b) => a.createdAt - b.createdAt);
    else if (input.sort === 'seats') filtered.sort((a, b) =>
      (a.maxTeamSize - 1 - a._count.members) - (b.maxTeamSize - 1 - b._count.members) || a.id.localeCompare(b.id));
    else filtered.sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id));
    const total = filtered.length;
    const pageProjects = filtered.slice((input.page - 1) * input.limit, input.page * input.limit);
    return { projects: pageProjects.map(toProjectListItem), page: input.page, limit: input.limit, total };
  }

  const orderBy = input.sort === 'oldest' ? [{ createdAt: 'asc' }, { id: 'asc' }] : [{ createdAt: 'desc' }, { id: 'asc' }];
  const [projects, total] = await Promise.all([
    prisma.project.findMany({ where, include: projectInclude, orderBy, skip: (input.page - 1) * input.limit, take: input.limit }),
    prisma.project.count({ where }),
  ]);
  return { projects: projects.map(toProjectListItem), page: input.page, limit: input.limit, total };
}
