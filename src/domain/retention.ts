/** Heuristic for review priority, not a measured probability of remembering. */
export function retentionEstimate(
  score: number,
  updatedAt: string,
  now: Date,
  attempts: number,
) {
  const age = Math.max(
    0,
    (now.getTime() - new Date(updatedAt).getTime()) / 86400000,
  );
  const halfLife = 14 + Math.min(60, Math.max(0, attempts)) * 2;
  const factor = Number.isFinite(age) ? Math.pow(0.5, age / halfLife) : 1;
  return Math.round(Math.max(0, Math.min(100, score)) * factor);
}
