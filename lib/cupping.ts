import { isRatingScore } from "@/lib/ratings";

export const INCOMPLETE_RATINGS_MESSAGE = "Please choose a rating for every coffee before saving.";
export const INCOMPLETE_SUBMISSION_MESSAGE = "Please choose a rating for every coffee before saving.";
export const SAVE_FAILED_MESSAGE = "Something went wrong while saving your evaluation. Please check your connection and try again.";
export const COMMENT_MAX_LENGTH = 300;

export type Draft = {
  score: number | null;
  aroma: string;
  flavor: string;
  overall: string;
};

export function emptyDraft(): Draft {
  return { score: null, aroma: "", flavor: "", overall: "" };
}

export function isDraftComplete(draft: Draft | undefined): draft is Draft & { score: number } {
  return Boolean(draft && isRatingScore(draft.score));
}

export function formatNotes(notes: { aroma?: string | null; flavor?: string | null; overall?: string | null } | null | undefined) {
  const lines = [
    notes?.aroma?.trim() ? `Aroma: ${notes.aroma.trim()}` : "",
    notes?.flavor?.trim() ? `Flavor: ${notes.flavor.trim()}` : "",
    notes?.overall?.trim() ? `Overall: ${notes.overall.trim()}` : "",
  ].filter(Boolean);
  return lines.length > 0 ? lines.join("\n") : null;
}

export function previousIndex(index: number) {
  return Math.max(0, index - 1);
}

export function nextIndex(index: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(index + 1, total - 1);
}
