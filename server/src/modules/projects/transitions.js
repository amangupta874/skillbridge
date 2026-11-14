export const PROJECT_TRANSITIONS = {
  DRAFT: ['OPEN', 'ARCHIVED'],
  OPEN: ['IN_PROGRESS', 'ARCHIVED'],
  IN_PROGRESS: ['COMPLETED', 'ARCHIVED'],
  COMPLETED: ['ARCHIVED'],
  ARCHIVED: [],
};

export function getAllowedTransitions(table, currentStatus) {
  return table[currentStatus] ?? [];
}
