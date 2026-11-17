import { describe, expect, test, vi } from 'vitest';
import { cleanupExpiredSessions } from './sessionCleanup.js';

describe('expired session cleanup', () => {
  test('deletes sessions whose expiry is in the past', async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 2 });
    const client = { session: { deleteMany } };
    const before = new Date();

    const result = await cleanupExpiredSessions(client);

    const after = new Date();
    expect(result).toEqual({ count: 2 });
    const [{ where }] = deleteMany.mock.calls[0];
    expect(where.expiresAt.lt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(where.expiresAt.lt.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});
