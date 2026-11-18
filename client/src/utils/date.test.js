import { afterEach, expect, it, vi } from 'vitest';
import { formatDate, formatRelativeTime } from './date.js';

afterEach(() => vi.useRealTimers());

it('shows elapsed minutes, hours and days and uses a date after 30 days', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-18T12:00:00Z'));

  expect(formatRelativeTime('2026-11-18T11:59:30Z')).toBe('just now');
  expect(formatRelativeTime('2026-11-18T11:59:00Z')).toBe('1 minute ago');
  expect(formatRelativeTime('2026-11-18T11:55:00Z')).toBe('5 minutes ago');
  expect(formatRelativeTime('2026-11-18T10:00:00Z')).toBe('2 hours ago');
  expect(formatRelativeTime('2026-11-15T12:00:00Z')).toBe('3 days ago');
  expect(formatRelativeTime('2026-10-19T12:00:00Z')).toBe(formatDate('2026-10-19T12:00:00Z'));
});
