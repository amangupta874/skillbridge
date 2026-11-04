import { describe, it, expect } from 'vitest';
import { ApiError, fieldErrorsFromApiError } from './client.js';

describe('api client helpers', () => {
  it('instantiates ApiError with appropriate properties', () => {
    const error = new ApiError({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details: { 'body.email': ['Invalid email'] },
    });

    expect(error.name).toBe('ApiError');
    expect(error.status).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Invalid input');
    expect(error.details).toEqual({ 'body.email': ['Invalid email'] });
  });

  it('transforms nested validation details into form field errors', () => {
    const error = new ApiError({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: {
        'body.email': ['Invalid email address'],
        'body.password': ['Password is too short'],
        'query.page': ['Must be positive'],
      },
    });

    const fieldErrors = fieldErrorsFromApiError(error);
    expect(fieldErrors).toEqual({
      email: 'Invalid email address',
      password: 'Password is too short',
      page: 'Must be positive',
    });
  });

  it('handles empty or missing details gracefully', () => {
    expect(fieldErrorsFromApiError(null)).toEqual({});
    expect(fieldErrorsFromApiError({})).toEqual({});
  });
});
