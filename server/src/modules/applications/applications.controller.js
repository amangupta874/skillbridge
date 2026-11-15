import { sendData, sendPage } from '../../utils/respond.js';
import * as applicationsService from './applications.service.js';

export async function createApplication(req, res) {
  const application = await applicationsService.applyToProject({
    projectId: req.valid.params.id,
    applicantId: req.user.id,
    message: req.valid.body.message,
  });
  sendData(res, application, 201);
}

export async function listProjectApplications(req, res) {
  const page = await applicationsService.listProjectApplications(req.valid.params.id, req.user.id, req.valid.query);
  sendPage(res, page.applications, page);
}

export async function listMyApplications(req, res) {
  const page = await applicationsService.listMyApplications(req.user.id, req.valid.query);
  sendPage(res, page.applications, page);
}

export async function updateApplication(req, res) {
  const application = await applicationsService.withdrawApplication(req.valid.params.id, req.user.id);
  sendData(res, application);
}
