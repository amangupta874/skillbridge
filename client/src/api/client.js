import axios from 'axios';

export class ApiError extends Error {
  constructor({ status, code, message, details }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

let unauthorizedHandler = null;

export function onUnauthorized(handler) {
  unauthorizedHandler = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status ?? 0;
    const body = error.response?.data?.error;
    const url = error.config?.url || '';

    // Non-auth 401 triggers the session expired handler if registered
    if (status === 401 && !url.includes('/auth/login') && !url.includes('/auth/register') && !url.includes('/auth/me')) {
      if (typeof unauthorizedHandler === 'function') {
        unauthorizedHandler();
      }
    }

    return Promise.reject(
      new ApiError({
        status,
        code: body?.code ?? 'NETWORK_ERROR',
        message: body?.message ?? 'Cannot reach the server. Check your connection and try again.',
        details: body?.details ?? {},
      }),
    );
  },
);

// Turns { "body.email": ["Invalid email"] } into { email: "Invalid email" } for react-hook-form setError.
export function fieldErrorsFromApiError(error) {
  const fieldErrors = {};
  for (const [key, messages] of Object.entries(error?.details ?? {})) {
    const cleanKey = key.replace(/^(body|query|params)\./, '');
    fieldErrors[cleanKey] = Array.isArray(messages) ? messages[0] : messages;
  }
  return fieldErrors;
}

