import { sendData, sendPage } from '../../utils/respond.js';
import * as usersService from './users.service.js';

export async function getPublicProfile(req, res) {
  sendData(res, await usersService.getPublicProfile(req.valid.params.id));
}

export async function listUsers(req, res) {
  const { users, ...page } = await usersService.listUsers(req.user.id, req.valid.query);
  sendPage(res, users, page);
}

export async function updateProfile(req, res) {
  sendData(res, await usersService.updateProfile(req.user.id, req.valid.body));
}

export async function updateSkills(req, res) {
  sendData(res, await usersService.updateSkills(req.user.id, req.valid.body.skills));
}

export async function updateLearningGoals(req, res) {
  sendData(res, await usersService.updateLearningGoals(req.user.id, req.valid.body.skillIds));
}
