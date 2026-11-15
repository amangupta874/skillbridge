import express from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import * as applicationsController from './applications.controller.js';
import {
  createApplicationSchema,
  listMyApplicationsSchema,
  listProjectApplicationsSchema,
  updateApplicationSchema,
} from './applications.schema.js';

export const applicationsRoutes = express.Router();

applicationsRoutes.get('/users/me/applications', requireAuth, validate(listMyApplicationsSchema), applicationsController.listMyApplications);
applicationsRoutes.post('/projects/:id/applications', requireAuth, validate(createApplicationSchema), applicationsController.createApplication);
applicationsRoutes.get('/projects/:id/applications', requireAuth, validate(listProjectApplicationsSchema), applicationsController.listProjectApplications);
applicationsRoutes.patch('/applications/:id', requireAuth, validate(updateApplicationSchema), applicationsController.updateApplication);
