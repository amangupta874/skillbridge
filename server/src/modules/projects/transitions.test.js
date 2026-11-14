import { describe, expect, test } from 'vitest';
import { getAllowedTransitions, PROJECT_TRANSITIONS } from './transitions.js';

describe('project status transitions', () => {
  test('allows only the transitions listed for each status', () => {
    const statuses = Object.keys(PROJECT_TRANSITIONS);

    for (const currentStatus of statuses) {
      const allowed = PROJECT_TRANSITIONS[currentStatus];
      expect(getAllowedTransitions(PROJECT_TRANSITIONS, currentStatus)).toEqual(allowed);
      for (const nextStatus of statuses) {
        if (allowed.includes(nextStatus)) continue;
        expect(getAllowedTransitions({ [currentStatus]: allowed }, currentStatus)).not.toContain(nextStatus);
      }
    }
  });
});
