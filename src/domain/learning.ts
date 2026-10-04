export const learningConfig = {
  distribution: { practice: 0.6, review: 0.25, maintenance: 0.15 },
  initialMastery: 50, maxDelta: 7, recentWindow: 12, maxInterval: 180,
  diagnostic: { minimum: 10, maximum: 20 },
} as const;
export interface Mastery { score: number; attempts: number; streak: number }
export interface AnswerEvidence { correct: boolean; difficulty: number; seconds: number; hint: boolean; attempts: number }
export function updateMastery(previous: Mastery, answer: AnswerEvidence): Mastery {
  const expected = 1 / (1 + Math.exp((answer.difficulty * 10 - previous.score) / 15));
  const evidence = answer.correct ? (answer.hint ? 0.65 : 1) / Math.sqrt(Math.max(1, answer.attempts)) : 0;
  const speed = answer.seconds < 2 ? 0.35 : answer.seconds > 180 ? 0.85 : 1;
  const confidence = Math.max(0.5, 1 - previous.attempts / 200);
  const delta = Math.max(-learningConfig.maxDelta, Math.min(learningConfig.maxDelta, 12 * (evidence - expected) * speed * confidence));
  return { score: Math.round(Math.max(0, Math.min(100, previous.score + delta)) * 100) / 100,
    attempts: previous.attempts + 1, streak: answer.correct ? Math.max(0, previous.streak) + 1 : Math.min(0, previous.streak) - 1 };
}
export function nextReview(correct: boolean, interval: number, hint = false) {
  return correct ? Math.min(learningConfig.maxInterval, Math.max(1, Math.round(interval * (hint ? 1.3 : 2.2)))) : 1;
}
export function earnedXp(correct: boolean, difficulty: number, hint: boolean) {
  return correct ? Math.round((10 + Math.min(10, Math.max(1, difficulty)) * 2) * (hint ? 0.5 : 1)) : 3;
}
export function levelFromXp(xp: number) { return Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1; }
export function nextStreak(previousDay: string | null, today: string, count: number) {
  if (previousDay === today) return count;
  return previousDay && Date.parse(today) - Date.parse(previousDay) === 86400000 ? count + 1 : 1;
}
export interface Candidate { id: string; difficulty: number; mastery: number; due: boolean; lastSeen?: string }
export function selectQuestion(candidates: Candidate[], recent: string[], random = Math.random): Candidate | undefined {
  const fresh = candidates.filter(q => !recent.slice(-learningConfig.recentWindow).includes(q.id));
  const pool = fresh.length ? fresh : candidates;
  const roll = random();
  const mode = roll < learningConfig.distribution.practice ? 'practice' : roll < 1 - learningConfig.distribution.maintenance ? 'review' : 'maintenance';
  return [...pool].sort((a, b) => {
    const rank = (q: Candidate) => Math.abs(q.difficulty * 10 - q.mastery) + (mode === 'review' ? (q.due ? -100 : 0) : mode === 'maintenance' ? -q.mastery : q.mastery * 0.3);
    return rank(a) - rank(b) || (a.lastSeen || '').localeCompare(b.lastSeen || '');
  })[0];
}
