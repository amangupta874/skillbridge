import pino from 'pino';
import { env } from './env.js';

export const loggerOptions = {
  level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL,
  redact: {
    paths: ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]', 'req.body.password'],
    censor: '[redacted]',
  },
};

export const logger = pino(loggerOptions);
