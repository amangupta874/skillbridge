import express from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { lookupsSchema } from './lookups.schema.js';
import * as lookupsController from './lookups.controller.js';

export const lookupsRoutes = express.Router();

lookupsRoutes.get('/', requireAuth, validate(lookupsSchema), lookupsController.getLookups);
