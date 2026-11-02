import { randomUUID } from 'node:crypto';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { originCheck } from './middleware/originCheck.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './utils/errors.js';
import { apiRouter } from './routes.js';

export const app = express();

app.set('trust proxy', 1); // behind the host's proxy: needed for correct client IPs and secure cookies
app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const requestId = req.headers['x-request-id'] || randomUUID();
      res.setHeader('X-Request-Id', requestId);
      return requestId;
    },
  }),
);
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(originCheck);

app.use('/api', apiRouter);

app.use((req, res, next) => next(notFound('Route not found')));
app.use(errorHandler);
