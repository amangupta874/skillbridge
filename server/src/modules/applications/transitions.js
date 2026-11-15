export const APPLICATION_TRANSITIONS = {
  PENDING: { ACCEPTED: 'owner', REJECTED: 'owner', WITHDRAWN: 'applicant' },
  WITHDRAWN: { PENDING: 'applicant' },
  ACCEPTED: {},
  REJECTED: {},
};

export function getAllowedTransitions(table, currentStatus, role) {
  return Object.entries(table[currentStatus] ?? {})
    .filter(([, allowedRole]) => allowedRole === role)
    .map(([nextStatus]) => nextStatus);
}
