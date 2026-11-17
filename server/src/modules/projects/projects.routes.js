import express from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { createProjectSchema, listProjectsSchema, projectIdSchema, updateProjectSchema } from './projects.schema.js';
import * as projectsController from './projects.controller.js';
import { matchingRoutes } from '../matching/matching.routes.js';

export const projectsRoutes = express.Router();

projectsRoutes.use(requireAuth);
projectsRoutes.get('/', validate(listProjectsSchema), projectsController.listProjects);
projectsRoutes.post('/', validate(createProjectSchema), projectsController.createProject);
projectsRoutes.use(matchingRoutes);
projectsRoutes.get('/:id', validate(projectIdSchema), projectsController.getProject);
projectsRoutes.patch('/:id', validate(updateProjectSchema), projectsController.updateProject);
