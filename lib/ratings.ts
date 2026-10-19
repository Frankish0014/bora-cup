export const RATING_OPTIONS = [
  { score: 1, label: "OK", range: "80–84", hundred: 82 },
  { score: 2, label: "Good", range: "84–86", hundred: 85 },
  { score: 3, label: "Great", range: "86–88", hundred: 87 },
  { score: 4, label: "Excellent", range: "88–90", hundred: 89 },
  { score: 5, label: "Take My Money", range: "99+", hundred: 99 },
] as const;

export type RatingScore = (typeof RATING_OPTIONS)[number]["score"];

export function isRatingScore(value: unknown): value is RatingScore {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

export function ratingOption(score: number | null | undefined) {
  return RATING_OPTIONS.find((option) => option.score === score);
}

export function ratingLabel(score: number | null | undefined) {
  const match = ratingOption(score);
  return match ? `${match.label} · ${match.range}` : "Not rated";
}

/** The rating words alone, without the score band. */
export function ratingScale(score: number | null | undefined) {
  return ratingOption(score)?.label ?? "";
}

export function ratingRange(score: number | null | undefined) {
  return ratingOption(score)?.range ?? "";
}

/** A 1–5 Bora answer, reported on the cupping 100-point scale. */
export function scoreOutOf100(value: number | null) {
  if (value == null || Number.isNaN(value)) return null;
  const match = ratingOption(value);
  if (match) return match.hundred;
  if (!isRatingScore(Math.round(value))) return null;
  return ratingOption(Math.round(value))?.hundred ?? null;
}

/** Confirmed cupping score: the form total when present, otherwise the Bora band. */
export function cuppingScore(rating: number | null | undefined, total?: number | null) {
  if (total != null && !Number.isNaN(total)) return Math.round(total * 10) / 10;
  return scoreOutOf100(rating ?? null);
}

export function formatAverage(value: number | null) {
  if (value == null || Number.isNaN(value)) return "—";
  return (Math.round(value * 10) / 10).toFixed(1);
}

export function formatScoreBand(rating: number | null | undefined, total?: number | null) {
  const option = ratingOption(rating);
  if (option && (total == null || Math.abs(total - option.hundred) < 0.6)) {
    return option.range;
  }
  const hundred = cuppingScore(rating, total);
  if (hundred == null) return "";
  return hundred % 1 === 0 ? String(hundred) : hundred.toFixed(1);
}
