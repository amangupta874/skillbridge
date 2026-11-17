import express from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import * as notificationsController from './notifications.controller.js';
import { listNotificationsSchema, notificationIdSchema } from './notifications.schema.js';

export const notificationsRoutes = express.Router();

notificationsRoutes.get('/', requireAuth, validate(listNotificationsSchema), notificationsController.listNotifications);
notificationsRoutes.get('/unread-count', requireAuth, notificationsController.getUnreadCount);
notificationsRoutes.patch('/read-all', requireAuth, notificationsController.readAllNotifications);
notificationsRoutes.patch('/:id/read', requireAuth, validate(notificationIdSchema), notificationsController.readNotification);
