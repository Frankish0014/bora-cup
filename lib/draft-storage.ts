import { emptyDraft, type Draft } from "@/lib/cupping";
import { isRatingScore } from "@/lib/ratings";

function key(participantSessionId: string) {
  return `bora-cup-draft:${participantSessionId}`;
}

export function readDraftSnapshot(participantSessionId: string) {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(key(participantSessionId)) ?? "";
  } catch {
    return "";
  }
}

export function parseStoredDrafts(raw: string) {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, Draft] => isDraft(entry[1])));
  } catch {
    return {};
  }
}

function isDraft(value: unknown): value is Draft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Draft;
  return (draft.score == null || isRatingScore(draft.score)) && typeof draft.aroma === "string" && typeof draft.flavor === "string" && typeof draft.overall === "string";
}

export function readDrafts(participantSessionId: string) {
  return parseStoredDrafts(readDraftSnapshot(participantSessionId));
}

export function writeDrafts(participantSessionId: string, drafts: Record<string, Draft>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key(participantSessionId), JSON.stringify(drafts));
  } catch {
    // Private mode or a full disk should not block cupping.
  }
}

export function draftsFromSaved(
  coffeeIds: string[],
  evaluations: Array<{ coffee_lot_id: string; overall_score: number; aroma_note: string | null; flavor_note: string | null; overall_note: string | null }>,
) {
  const saved = new Map(evaluations.map((evaluation) => [evaluation.coffee_lot_id, evaluation]));
  return Object.fromEntries(
    coffeeIds.map((id) => {
      const evaluation = saved.get(id);
      if (!evaluation) return [id, emptyDraft()];
      return [
        id,
        {
          score: evaluation.overall_score,
          aroma: evaluation.aroma_note ?? "",
          flavor: evaluation.flavor_note ?? "",
          overall: evaluation.overall_note ?? "",
        } satisfies Draft,
      ];
    }),
  );
}

export function mergeUnsavedDrafts(current: Record<string, Draft>, stored: Record<string, Draft>, savedIds: Set<string>) {
  const next = { ...current };
  for (const [id, draft] of Object.entries(stored)) {
    if (!savedIds.has(id) && next[id]) next[id] = draft;
  }
  return next;
}
