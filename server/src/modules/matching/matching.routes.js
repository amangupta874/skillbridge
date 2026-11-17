import express from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import * as matchingController from './matching.controller.js';
import { projectMatchesSchema } from './matching.schema.js';

export const matchingRoutes = express.Router();

matchingRoutes.get('/:id/matches', requireAuth, validate(projectMatchesSchema), matchingController.getProjectMatches);
