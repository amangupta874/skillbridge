import { sendData } from '../../utils/respond.js';
import * as matchingService from './matching.service.js';

export async function getProjectMatches(req, res) {
  const matches = await matchingService.getMatchesForProject({
    projectId: req.valid.params.id,
    ownerId: req.user.id,
    limit: req.valid.query.limit,
  });
  sendData(res, matches);
}
