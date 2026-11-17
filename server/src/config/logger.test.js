import { describe, expect, test } from 'vitest';
import pino from 'pino';
import { loggerOptions } from './logger.js';

describe('log redaction', () => {
  test('redacts cookies, authorization headers, and passwords', () => {
    const lines = [];
    const testLogger = pino({ ...loggerOptions, level: 'info', base: null, timestamp: false }, {
      write: (line) => lines.push(line),
    });

    testLogger.info({
      req: {
        headers: { cookie: 'sid=cookie-secret', authorization: 'Bearer auth-secret' },
        body: { password: 'password-secret' },
      },
      res: { headers: { 'set-cookie': 'sid=response-secret' } },
    }, 'request');
    const output = lines.join('');

    expect(output).not.toContain('cookie-secret');
    expect(output).not.toContain('auth-secret');
    expect(output).not.toContain('password-secret');
    expect(output).not.toContain('response-secret');
    expect(output.match(/\[redacted\]/g)).toHaveLength(4);
  });
});
