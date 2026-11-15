export function formatLabel(value = '') {
  return value
    .toLowerCase()
    .split('_')
    .map((word, index) => index === 0 ? `${word[0]?.toUpperCase() || ''}${word.slice(1)}` : word)
    .join(' ');
}
