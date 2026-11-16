import { describe, expect, test } from 'vitest';
import { EXCHANGE_TRANSITIONS, getAllowedTransitions } from './transitions.js';

describe('exchange status transitions', () => {
  test('allows each documented transition only for its role', () => {
    for (const [currentStatus, transitions] of Object.entries(EXCHANGE_TRANSITIONS)) {
      for (const [nextStatus, role] of Object.entries(transitions)) {
        expect(getAllowedTransitions(EXCHANGE_TRANSITIONS, currentStatus, role)).toContain(nextStatus);
        for (const otherRole of ['sender', 'recipient', 'participant']) {
          if (otherRole !== role) {
            expect(getAllowedTransitions(EXCHANGE_TRANSITIONS, currentStatus, otherRole)).not.toContain(nextStatus);
          }
        }
      }
      for (const role of ['sender', 'recipient', 'participant']) {
        for (const nextStatus of Object.keys(EXCHANGE_TRANSITIONS)) {
          if (!transitions[nextStatus] || transitions[nextStatus] !== role) {
            expect(getAllowedTransitions(EXCHANGE_TRANSITIONS, currentStatus, role)).not.toContain(nextStatus);
          }
        }
      }
    }
    expect(getAllowedTransitions(EXCHANGE_TRANSITIONS, 'UNKNOWN', 'sender')).toEqual([]);
  });
});
