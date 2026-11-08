import { sendData } from '../../utils/respond.js';
import * as skillsService from './skills.service.js';

export async function searchSkills(req, res) {
  const skills = await skillsService.searchSkills(req.valid.query);
  sendData(res, skills);
}
