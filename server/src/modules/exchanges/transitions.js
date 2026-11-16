export const EXCHANGE_TRANSITIONS = {
  PENDING: { ACCEPTED: 'recipient', REJECTED: 'recipient', CANCELLED: 'sender' },
  ACCEPTED: { COMPLETED: 'participant', CANCELLED: 'participant' },
  REJECTED: {},
  CANCELLED: {},
  COMPLETED: {},
};

export function getAllowedTransitions(table, currentStatus, role) {
  return Object.entries(table[currentStatus] ?? {})
    .filter(([, allowedRole]) => allowedRole === role)
    .map(([nextStatus]) => nextStatus);
}
