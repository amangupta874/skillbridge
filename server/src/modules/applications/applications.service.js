import { prisma } from '../../config/prisma.js';
import { badRequest, conflict, forbidden, notFound } from '../../utils/errors.js';
import { APPLICATION_TRANSITIONS, getAllowedTransitions } from './transitions.js';

const applicationInclude = {
  project: { select: { id: true, title: true } },
  applicant: {
    select: {
      id: true,
      fullName: true,
      college: { select: { id: true, name: true } },
      skills: { select: { level: true, skill: { select: { id: true, name: true } } } },
    },
  },
};

const levelRank = { ADVANCED: 0, INTERMEDIATE: 1, BEGINNER: 2 };

function toApplication(application, role) {
  const topSkills = [...application.applicant.skills]
    .sort((left, right) => levelRank[left.level] - levelRank[right.level] || left.skill.name.localeCompare(right.skill.name))
    .slice(0, 3);
  return {
    id: application.id,
    projectId: application.projectId,
    project: application.project,
    applicant: {
      id: application.applicant.id,
      fullName: application.applicant.fullName,
      college: application.applicant.college,
      topSkills,
    },
    message: application.message,
    status: application.status,
    createdAt: application.createdAt,
    decidedAt: application.decidedAt,
    allowedTransitions: getAllowedTransitions(APPLICATION_TRANSITIONS, application.status, role),
  };
}

export async function applyToProject({ projectId, applicantId, message }) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || (project.status === 'DRAFT' && project.ownerId !== applicantId)) throw notFound('Project not found');
  if (project.ownerId === applicantId) throw badRequest('You cannot apply to your own project');
  if (project.status !== 'OPEN') throw conflict('This project is not accepting applications');

  const existing = await prisma.projectApplication.findUnique({
    where: { projectId_applicantId: { projectId, applicantId } },
  });
  if (existing && existing.status !== 'WITHDRAWN') throw conflict('You have already applied to this project');

  return prisma.$transaction(async (tx) => {
    const application = existing
      ? await tx.projectApplication.update({
        where: { id: existing.id },
        data: { status: 'PENDING', message, decidedAt: null, createdAt: new Date() },
      })
      : await tx.projectApplication.create({ data: { projectId, applicantId, message } });
    await tx.notification.create({
      data: { recipientId: project.ownerId, type: 'APPLICATION_RECEIVED', applicationId: application.id },
    });
    const fullApplication = await tx.projectApplication.findUnique({ where: { id: application.id }, include: applicationInclude });
    return toApplication(fullApplication, 'applicant');
  });
}

export async function listProjectApplications(projectId, callerId, { status, page, limit }) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { ownerId: true } });
  if (!project) throw notFound('Project not found');
  if (project.ownerId !== callerId) throw forbidden('Only the project owner can view applications');

  const where = { projectId, ...(status && { status }) };
  const [applications, total] = await Promise.all([
    prisma.projectApplication.findMany({
      where,
      include: applicationInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.projectApplication.count({ where }),
  ]);
  return { applications: applications.map((application) => toApplication(application, 'owner')), page, limit, total };
}

export async function listMyApplications(applicantId, { status, page, limit }) {
  const where = { applicantId, ...(status && { status }) };
  const [applications, total] = await Promise.all([
    prisma.projectApplication.findMany({
      where,
      include: applicationInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.projectApplication.count({ where }),
  ]);
  return { applications: applications.map((application) => toApplication(application, 'applicant')), page, limit, total };
}

export async function withdrawApplication(applicationId, callerId) {
  const application = await prisma.projectApplication.findUnique({ where: { id: applicationId } });
  if (!application || application.applicantId !== callerId) throw notFound('Application not found');
  if (!getAllowedTransitions(APPLICATION_TRANSITIONS, application.status, 'applicant').includes('WITHDRAWN')) {
    throw conflict('This application cannot be withdrawn');
  }
  const updated = await prisma.projectApplication.update({
    where: { id: applicationId },
    data: { status: 'WITHDRAWN' },
    include: applicationInclude,
  });
  return toApplication(updated, 'applicant');
}

export async function decideApplication({ applicationId, ownerId, decision }) {
  return prisma.$transaction(async (tx) => {
    const application = await tx.projectApplication.findUnique({ where: { id: applicationId }, include: { project: true } });
    if (!application) throw notFound('Application not found');
    if (application.project.ownerId !== ownerId) throw forbidden('Only the project owner can decide on applications');

    // Lock the project row so concurrent decisions cannot take the same last seat.
    await tx.$queryRaw`SELECT id FROM projects WHERE id = ${application.projectId} FOR UPDATE`;

    const current = await tx.projectApplication.findUnique({ where: { id: applicationId } });
    if (current.status !== 'PENDING') throw conflict('This application was already processed');

    if (decision === 'ACCEPTED') {
      const project = await tx.project.findUnique({
        where: { id: application.projectId },
        include: { _count: { select: { members: true } } },
      });
      if (project.status !== 'OPEN') throw conflict('This project is not open');
      const seatsTaken = 1 + project._count.members;
      if (seatsTaken >= project.maxTeamSize) throw conflict('The team is already full');
      await tx.projectMember.create({ data: { projectId: project.id, userId: application.applicantId } });
    }

    const updated = await tx.projectApplication.update({
      where: { id: applicationId },
      data: { status: decision, decidedAt: new Date() },
    });
    await tx.notification.create({
      data: {
        recipientId: application.applicantId,
        type: decision === 'ACCEPTED' ? 'APPLICATION_ACCEPTED' : 'APPLICATION_REJECTED',
        applicationId,
      },
    });
    return updated;
  });
}

export async function changeApplicationStatus(applicationId, callerId, status) {
  if (status === 'WITHDRAWN') return withdrawApplication(applicationId, callerId);
  await decideApplication({ applicationId, ownerId: callerId, decision: status });
  const application = await prisma.projectApplication.findUnique({ where: { id: applicationId }, include: applicationInclude });
  return toApplication(application, 'owner');
}
