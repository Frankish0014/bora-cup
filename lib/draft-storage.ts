import { emptyDraft, isFormType, type CuppingDraft, type FormTypeId } from "@/lib/forms";
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

export function parseStoredDrafts(raw: string, formType: FormTypeId = "bora") {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(
      Object.entries(parsed).flatMap(([id, value]) => {
        const draft = asDraft(value, formType);
        return draft ? [[id, draft] as const] : [];
      }),
    );
  } catch {
    return {};
  }
}

function asDraft(value: unknown, formType: FormTypeId): CuppingDraft | null {
  if (!value || typeof value !== "object") return null;
  const draft = value as Partial<CuppingDraft> & { aroma?: string; flavor?: string; overall?: string; score?: number | null };
  if (typeof draft.aroma !== "string" || typeof draft.flavor !== "string" || typeof draft.overall !== "string") return null;
  if (draft.score != null && !isRatingScore(draft.score)) return null;
  const payload = draft.payload && typeof draft.payload === "object" ? (draft.payload as Record<string, unknown>) : {};
  return {
    formType: isFormType(draft.formType) ? draft.formType : formType,
    score: draft.score ?? null,
    aroma: draft.aroma,
    flavor: draft.flavor,
    overall: draft.overall,
    total: typeof draft.total === "number" ? draft.total : null,
    payload,
  };
}

export function readDrafts(participantSessionId: string, formType: FormTypeId = "bora") {
  return parseStoredDrafts(readDraftSnapshot(participantSessionId), formType);
}

export function writeDrafts(participantSessionId: string, drafts: Record<string, CuppingDraft>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key(participantSessionId), JSON.stringify(drafts));
  } catch {
    // Private mode or a full disk should not block cupping.
  }
}

export function draftsFromSaved(
  coffeeIds: string[],
  evaluations: Array<{
    coffee_lot_id: string;
    overall_score: number;
    aroma_note: string | null;
    flavor_note: string | null;
    overall_note: string | null;
    form_payload?: Record<string, unknown> | null;
    total_score?: number | null;
  }>,
  formType: FormTypeId = "bora",
) {
  const saved = new Map(evaluations.map((evaluation) => [evaluation.coffee_lot_id, evaluation]));
  return Object.fromEntries(
    coffeeIds.map((id) => {
      const evaluation = saved.get(id);
      if (!evaluation) return [id, emptyDraft(formType)];
      return [
        id,
        {
          formType,
          score: evaluation.overall_score,
          aroma: evaluation.aroma_note ?? "",
          flavor: evaluation.flavor_note ?? "",
          overall: evaluation.overall_note ?? "",
          total: evaluation.total_score ?? null,
          payload: evaluation.form_payload ?? {},
        } satisfies CuppingDraft,
      ];
    }),
  );
}

export function mergeUnsavedDrafts(current: Record<string, CuppingDraft>, stored: Record<string, CuppingDraft>, savedIds: Set<string>) {
  const next = { ...current };
  for (const [id, draft] of Object.entries(stored)) {
    if (!savedIds.has(id) && next[id]) next[id] = draft;
  }
  return next;
}
