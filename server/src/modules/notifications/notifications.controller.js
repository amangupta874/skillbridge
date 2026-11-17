import { sendData, sendPage } from '../../utils/respond.js';
import * as notificationsService from './notifications.service.js';

export async function listNotifications(req, res) {
  const page = await notificationsService.listNotifications(req.user.id, req.valid.query);
  sendPage(res, page.notifications, page);
}

export async function getUnreadCount(req, res) {
  const count = await notificationsService.getUnreadCount(req.user.id);
  sendData(res, { count });
}

export async function readAllNotifications(req, res) {
  const updated = await notificationsService.readAllNotifications(req.user.id);
  sendData(res, { updated });
}

export async function readNotification(req, res) {
  const notification = await notificationsService.readNotification(req.valid.params.id, req.user.id);
  sendData(res, notification);
}
