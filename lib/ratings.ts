export const RATING_OPTIONS = [
  { score: 1, label: "OK" },
  { score: 2, label: "Good" },
  { score: 3, label: "Very Good" },
  { score: 4, label: "Excellent" },
  { score: 5, label: "Take My Money" },
] as const;

export type RatingScore = (typeof RATING_OPTIONS)[number]["score"];

export function isRatingScore(value: unknown): value is RatingScore {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

export function ratingLabel(score: number | null | undefined) {
  const match = RATING_OPTIONS.find((option) => option.score === score);
  return match ? `${match.score} — ${match.label}` : "Not rated";
}

/** The rating words alone, without the 1–5 figure. */
export function ratingScale(score: number | null | undefined) {
  const match = RATING_OPTIONS.find((option) => option.score === score);
  return match?.label ?? "";
}

/** A 1–5 cupping answer, reported on a 100-point scale. */
export function scoreOutOf100(value: number | null) {
  if (value == null || Number.isNaN(value)) return null;
  return Math.round((value / 5) * 1000) / 10;
}

export function formatAverage(value: number | null) {
  const scaled = scoreOutOf100(value);
  if (scaled == null) return "—";
  return scaled.toFixed(1);
}
