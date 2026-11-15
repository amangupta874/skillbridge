export const projectStatusTransitions = {
  DRAFT: ['OPEN', 'ARCHIVED'],
  OPEN: ['IN_PROGRESS', 'ARCHIVED'],
  IN_PROGRESS: ['COMPLETED', 'ARCHIVED'],
  COMPLETED: ['ARCHIVED'],
  ARCHIVED: [],
};
