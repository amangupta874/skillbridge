import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError, zodDetails } from '../utils/errors.js';

function toAppError(err) {
  if (err instanceof AppError) return err;
  if (err instanceof z.ZodError) {
    return new AppError(400, 'VALIDATION_ERROR', 'Please correct the submitted fields.', zodDetails(err));
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return new AppError(409, 'DUPLICATE', 'This record already exists.');
    if (err.code === 'P2025') return new AppError(404, 'NOT_FOUND', 'Record not found.');
  }
  if (err?.type === 'entity.parse.failed') return new AppError(400, 'BAD_REQUEST', 'Request body is not valid JSON.');
  if (err?.type === 'entity.too.large') return new AppError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large.');
  return null; // unknown error
}

// Express recognises an error handler by its four parameters, so keep `next` even if unused.
export function errorHandler(err, req, res, next) {
  const appError = toAppError(err);
  if (!appError) {
    req.log.error({ err }, 'Unhandled error');           // details only in the logs
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' } });
  }
  req.log.warn({ code: appError.code, status: appError.statusCode }, appError.message);
  return res.status(appError.statusCode).json({
    error: { code: appError.code, message: appError.message, details: appError.details },
  });
}
