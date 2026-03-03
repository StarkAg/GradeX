/**
 * Small formatting helpers used across the app.
 */

/** Display name: "First Last" or fallback to "User" */
export function formatDisplayName(name) {
  if (!name || typeof name !== 'string') return 'User';
  return name.trim() || 'User';
}

/** Percentage with one decimal; null/undefined -> "-" */
export function formatPercent(value) {
  if (value == null || Number.isNaN(value)) return '—';
  return `${Number(value).toFixed(1)}%`;
}

/** Date to YYYY-MM-DD for inputs/APIs */
export function toDateString(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}
