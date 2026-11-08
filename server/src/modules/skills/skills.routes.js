import express from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { searchSkillsSchema } from './skills.schema.js';
import * as skillsController from './skills.controller.js';

export const skillsRoutes = express.Router();

skillsRoutes.get('/', requireAuth, validate(searchSkillsSchema), skillsController.searchSkills);
