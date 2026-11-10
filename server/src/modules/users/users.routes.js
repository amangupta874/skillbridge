import express from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import * as usersController from './users.controller.js';
import {
  listUsersSchema,
  updateLearningGoalsSchema,
  updateProfileSchema,
  updateSkillsSchema,
  userIdSchema,
} from './users.schema.js';

export const usersRoutes = express.Router();

usersRoutes.get('/', requireAuth, validate(listUsersSchema), usersController.listUsers);
usersRoutes.get('/:id', requireAuth, validate(userIdSchema), usersController.getPublicProfile);
usersRoutes.patch('/me', requireAuth, validate(updateProfileSchema), usersController.updateProfile);
usersRoutes.put('/me/skills', requireAuth, validate(updateSkillsSchema), usersController.updateSkills);
usersRoutes.put('/me/learning-goals', requireAuth, validate(updateLearningGoalsSchema), usersController.updateLearningGoals);
