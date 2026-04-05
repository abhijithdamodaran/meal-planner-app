/**
 * Returns today's date as YYYY-MM-DD in the user's LOCAL timezone.
 * Never use new Date().toISOString() for "today" — that returns UTC,
 * which is wrong for users in timezones ahead of UTC (e.g. IST = UTC+5:30).
 */
export function localToday(): string {
  return localDateString(new Date());
}

/**
 * Formats a Date object as YYYY-MM-DD using the local timezone.
 */
export function localDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns a date N days before/after a YYYY-MM-DD string.
 * Uses UTC arithmetic since the stored date strings are UTC-based.
 */
export function offsetDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}
