import { sendData, sendPage } from '../../utils/respond.js';
import * as exchangesService from './exchanges.service.js';

export async function createExchange(req, res) {
  const exchange = await exchangesService.createExchange({ senderId: req.user.id, ...req.valid.body });
  sendData(res, exchange, 201);
}

export async function listExchanges(req, res) {
  const page = await exchangesService.listExchanges(req.user.id, req.valid.query);
  sendPage(res, page.exchanges, page);
}

export async function updateExchange(req, res) {
  const exchange = await exchangesService.changeExchangeStatus(req.valid.params.id, req.user.id, req.valid.body.status);
  sendData(res, exchange);
}
