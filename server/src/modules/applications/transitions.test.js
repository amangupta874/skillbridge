import { describe, expect, test } from 'vitest';
import { APPLICATION_TRANSITIONS, getAllowedTransitions } from './transitions.js';

describe('application status transitions', () => {
  test('allows only the documented transition for each status and role', () => {
    expect(getAllowedTransitions(APPLICATION_TRANSITIONS, 'PENDING', 'owner')).toEqual(['ACCEPTED', 'REJECTED']);
    expect(getAllowedTransitions(APPLICATION_TRANSITIONS, 'PENDING', 'applicant')).toEqual(['WITHDRAWN']);
    expect(getAllowedTransitions(APPLICATION_TRANSITIONS, 'WITHDRAWN', 'applicant')).toEqual(['PENDING']);
    expect(getAllowedTransitions(APPLICATION_TRANSITIONS, 'WITHDRAWN', 'owner')).toEqual([]);
    expect(getAllowedTransitions(APPLICATION_TRANSITIONS, 'ACCEPTED', 'owner')).toEqual([]);
    expect(getAllowedTransitions(APPLICATION_TRANSITIONS, 'ACCEPTED', 'applicant')).toEqual([]);
    expect(getAllowedTransitions(APPLICATION_TRANSITIONS, 'REJECTED', 'owner')).toEqual([]);
    expect(getAllowedTransitions(APPLICATION_TRANSITIONS, 'REJECTED', 'applicant')).toEqual([]);
    expect(getAllowedTransitions(APPLICATION_TRANSITIONS, 'UNKNOWN', 'owner')).toEqual([]);

    for (const [currentStatus, transitions] of Object.entries(APPLICATION_TRANSITIONS)) {
      for (const [nextStatus, role] of Object.entries(transitions)) {
        expect(getAllowedTransitions(APPLICATION_TRANSITIONS, currentStatus, role)).toContain(nextStatus);
        const otherRole = role === 'owner' ? 'applicant' : 'owner';
        expect(getAllowedTransitions(APPLICATION_TRANSITIONS, currentStatus, otherRole)).not.toContain(nextStatus);
      }
    }
  });
});
