import express from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import * as exchangesController from './exchanges.controller.js';
import { createExchangeSchema, listExchangesSchema, updateExchangeSchema } from './exchanges.schema.js';

export const exchangesRoutes = express.Router();

exchangesRoutes.post('/', requireAuth, validate(createExchangeSchema), exchangesController.createExchange);
exchangesRoutes.get('/', requireAuth, validate(listExchangesSchema), exchangesController.listExchanges);
exchangesRoutes.patch('/:id', requireAuth, validate(updateExchangeSchema), exchangesController.updateExchange);
