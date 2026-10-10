export function withinLastDays(
  value: string | Date,
  days: number,
  now = Date.now(),
) {
  return now - new Date(value).getTime() <= days * 24 * 60 * 60 * 1000;
}
