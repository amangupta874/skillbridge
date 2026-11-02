// Every expected failure is thrown as an AppError. The error handler turns it into JSON.
export class AppError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message, details) => new AppError(400, 'BAD_REQUEST', message, details);
export const unauthorized = (message = 'Please log in') => new AppError(401, 'UNAUTHORIZED', message);
export const forbidden = (message = 'You do not have permission to do this') => new AppError(403, 'FORBIDDEN', message);
export const notFound = (message = 'Resource not found') => new AppError(404, 'NOT_FOUND', message);
export const conflict = (message, details) => new AppError(409, 'CONFLICT', message, details);

// Turns zod issues into { "body.email": ["Invalid email address"] }.
export function zodDetails(zodError) {
  const details = {};
  for (const issue of zodError.issues) {
    const key = issue.path.join('.') || '_';
    (details[key] ||= []).push(issue.message);
  }
  return details;
}
