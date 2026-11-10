import { sendData } from '../../utils/respond.js';
import * as lookupsService from './lookups.service.js';

export async function getLookups(req, res) {
  const lookups = await lookupsService.getLookups();
  sendData(res, lookups);
}
