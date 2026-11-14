import { sendData, sendPage } from '../../utils/respond.js';
import * as projectsService from './projects.service.js';

export async function createProject(req, res) {
  const project = await projectsService.createProject(req.user.id, req.valid.body);
  sendData(res, project, 201);
}

export async function listProjects(req, res) {
  const page = await projectsService.listProjects(req.user.id, req.valid.query);
  sendPage(res, page.projects, page);
}

export async function getProject(req, res) {
  const project = await projectsService.getProject(req.valid.params.id, req.user.id);
  sendData(res, project);
}

export async function updateProject(req, res) {
  const project = await projectsService.updateProject(req.valid.params.id, req.user.id, req.valid.body);
  sendData(res, project);
}
