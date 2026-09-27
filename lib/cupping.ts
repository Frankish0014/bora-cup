import { isRatingScore } from "@/lib/ratings";

export const INCOMPLETE_RATINGS_MESSAGE = "Please complete aroma, flavor, overall, and the rating before continuing.";
export const INCOMPLETE_SUBMISSION_MESSAGE = "Please complete aroma, flavor, overall, and the rating for every coffee before submitting.";
export const SAVE_FAILED_MESSAGE = "Something went wrong while saving your evaluation. Please check your connection and try again.";
export const COMMENT_MAX_LENGTH = 300;

export type CuppingNotes = {
  aroma: string;
  flavor: string;
  overall: string;
};

export type Draft = {
  score: number | null;
  aroma: string;
  flavor: string;
  overall: string;
};

export function emptyDraft(): Draft {
  return { score: null, aroma: "", flavor: "", overall: "" };
}

function hasNote(value: string | undefined) {
  return Boolean(value?.trim());
}

export function isDraftComplete(draft: Draft | undefined): draft is Draft & { score: number } {
  return Boolean(draft && hasNote(draft.aroma) && hasNote(draft.flavor) && hasNote(draft.overall) && isRatingScore(draft.score));
}

export function parseNotes(raw: string | null | undefined): CuppingNotes {
  const empty = { aroma: "", flavor: "", overall: "" };
  if (!raw?.trim()) return empty;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { ...empty, overall: raw };
    const record = parsed as Record<string, unknown>;
    if (typeof record.aroma !== "string" && typeof record.flavor !== "string" && typeof record.overall !== "string") {
      return { ...empty, overall: raw };
    }
    return {
      aroma: typeof record.aroma === "string" ? record.aroma : "",
      flavor: typeof record.flavor === "string" ? record.flavor : "",
      overall: typeof record.overall === "string" ? record.overall : "",
    };
  } catch {
    return { ...empty, overall: raw };
  }
}

export function notesAreStructured(raw: string | null | undefined) {
  if (!raw?.trim()) return false;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;
    const record = parsed as Record<string, unknown>;
    return typeof record.aroma === "string" || typeof record.flavor === "string" || typeof record.overall === "string";
  } catch {
    return false;
  }
}

export function serializeNotes(notes: CuppingNotes) {
  const aroma = notes.aroma.trim();
  const flavor = notes.flavor.trim();
  const overall = notes.overall.trim();
  if (!aroma && !flavor && !overall) return null;
  return JSON.stringify({ aroma, flavor, overall });
}

export function formatNotes(raw: string | null | undefined) {
  const notes = parseNotes(raw);
  if (!notesAreStructured(raw)) return notes.overall.trim() || null;
  const lines = [
    notes.aroma.trim() ? `Aroma: ${notes.aroma.trim()}` : "",
    notes.flavor.trim() ? `Flavor: ${notes.flavor.trim()}` : "",
    notes.overall.trim() ? `Overall: ${notes.overall.trim()}` : "",
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
