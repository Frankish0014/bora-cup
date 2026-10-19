"use client";

import { CoffeeInformationCard } from "@/components/cupping/CoffeeInformationCard";
import { CuppingProgress } from "@/components/cupping/CuppingProgress";
import { LeaveTableButton } from "@/components/cupping/LeaveTableButton";
import { ProtocolFields, formBadge } from "@/components/cupping/ProtocolFields";
import { SessionHeader } from "@/components/cupping/SessionHeader";
import { useKeyboardInset } from "@/components/cupping/useKeyboardInset";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/field";
import { saveAndSubmitCupping, syncEvaluations } from "@/lib/actions/participant";
import { INCOMPLETE_SUBMISSION_MESSAGE } from "@/lib/cupping";
import { draftsFromSaved, mergeUnsavedDrafts, parseStoredDrafts, readDraftSnapshot, writeDrafts } from "@/lib/draft-storage";
import { emptyDraft, isDraftComplete, syncDraft, type CuppingDraft, type FormTypeId } from "@/lib/forms";
import { cn } from "@/lib/utils";
import type { CoffeeLot } from "@/types/domain";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

type SavedEvaluation = {
  coffee_lot_id: string;
  overall_score: number;
  aroma_note: string | null;
  flavor_note: string | null;
  overall_note: string | null;
  form_payload?: Record<string, unknown> | null;
  total_score?: number | null;
};

export function CuppingExperience({
  slug,
  sessionName,
  eventName,
  formType,
  participantSessionId,
  coffees,
  evaluations,
}: {
  slug: string;
  sessionName: string;
  eventName: string;
  formType: FormTypeId;
  participantSessionId: string;
  coffees: CoffeeLot[];
  evaluations: SavedEvaluation[];
}) {
  const router = useRouter();
  useKeyboardInset();
  const [overrides, setOverrides] = useState<Record<string, Partial<CuppingDraft>>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const snapshot = useSyncExternalStore(
    () => () => {},
    () => readDraftSnapshot(participantSessionId),
    () => "",
  );
  const drafts = useMemo(() => {
    const base = draftsFromSaved(
      coffees.map((coffee) => coffee.id),
      evaluations,
      formType,
    );
    const savedIds = new Set(evaluations.map((evaluation) => evaluation.coffee_lot_id));
    const restored = mergeUnsavedDrafts(base, parseStoredDrafts(snapshot, formType), savedIds);
    const next = Object.fromEntries(Object.entries(restored).map(([id, draft]) => [id, syncDraft(draft)]));
    for (const [id, partial] of Object.entries(overrides)) {
      if (next[id]) next[id] = syncDraft({ ...next[id], ...partial, payload: partial.payload ? { ...next[id].payload, ...partial.payload } : next[id].payload });
    }
    return next;
  }, [coffees, evaluations, formType, overrides, snapshot]);
  const draftsRef = useRef(drafts);
  draftsRef.current = drafts;
  const lastSent = useRef("");
  const syncTimer = useRef<number>(0);

  function ratedPayload(source: Record<string, CuppingDraft>) {
    return coffees.flatMap((coffee) => {
      const draft = syncDraft(source[coffee.id] ?? emptyDraft(formType));
      if (!isDraftComplete(draft) && !draft.aroma && !draft.flavor && !draft.overall && Object.keys(draft.payload).length === 0) return [];
      if (!isDraftComplete(draft)) return [];
      return [
        {
          coffeeLotId: coffee.id,
          score: draft.score,
          aroma: draft.aroma,
          flavor: draft.flavor,
          overall: draft.overall,
          totalScore: draft.total,
          formType: draft.formType,
          payload: draft.payload,
        },
      ];
    });
  }

  function pushDrafts(source: Record<string, CuppingDraft>) {
    const next = ratedPayload(source);
    const fingerprint = JSON.stringify(next);
    if (next.length === 0 || fingerprint === lastSent.current) return;
    lastSent.current = fingerprint;
    void syncEvaluations({ participantSessionId, evaluations: next }).then((result) => {
      if (!result.ok) lastSent.current = "";
    });
  }

  function queueSync(source: Record<string, CuppingDraft>, immediate: boolean) {
    window.clearTimeout(syncTimer.current);
    if (immediate) {
      pushDrafts(source);
      return;
    }
    syncTimer.current = window.setTimeout(() => pushDrafts(draftsRef.current), 800);
  }

  useEffect(() => {
    queueSync(draftsRef.current, true);
    function flush() {
      queueSync(draftsRef.current, true);
    }
    function onVisibility() {
      if (document.visibilityState === "hidden") flush();
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      window.clearTimeout(syncTimer.current);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, [participantSessionId]);

  function update(coffeeId: string, partial: Partial<CuppingDraft>) {
    const nextOverrides = { ...overrides, [coffeeId]: { ...overrides[coffeeId], ...partial, payload: { ...overrides[coffeeId]?.payload, ...partial.payload } } };
    setOverrides(nextOverrides);
    const nextDrafts = {
      ...drafts,
      [coffeeId]: syncDraft({
        ...(drafts[coffeeId] ?? emptyDraft(formType)),
        ...partial,
        payload: { ...(drafts[coffeeId]?.payload ?? {}), ...(partial.payload ?? {}) },
      }),
    };
    writeDrafts(participantSessionId, nextDrafts);
    setError(null);
    queueSync(nextDrafts, partial.score != null || partial.payload != null);
  }

  async function handleSave() {
    const firstIncomplete = coffees.find((coffee) => !isDraftComplete(drafts[coffee.id]));
    if (firstIncomplete) {
      setError(`Please finish ${firstIncomplete.lot_name} before saving.`);
      document.getElementById(`coffee-${firstIncomplete.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setPending(true);
    const result = await saveAndSubmitCupping({
      participantSessionId,
      evaluations: coffees.map((coffee) => {
        const draft = syncDraft(drafts[coffee.id] ?? emptyDraft(formType));
        return {
          coffeeLotId: coffee.id,
          score: draft.score,
          aroma: draft.aroma,
          flavor: draft.flavor,
          overall: draft.overall,
          totalScore: draft.total,
          formType: draft.formType,
          payload: draft.payload,
        };
      }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.message || INCOMPLETE_SUBMISSION_MESSAGE);
      return;
    }
    router.push(`/session/${slug}/complete`);
  }

  if (coffees.length === 0) return null;

  return (
    <div className="min-h-dvh">
      <SessionHeader sessionName={sessionName} eventName={eventName}>
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="truncate text-[11px] text-ink-mute">{formBadge(formType)}</p>
          <LeaveTableButton
            slug={slug}
            participantSessionId={participantSessionId}
            hasRatings={coffees.some((coffee) => isDraftComplete(drafts[coffee.id]))}
          />
        </div>
        <CuppingProgress done={coffees.map((coffee) => isDraftComplete(drafts[coffee.id]))} />
      </SessionHeader>
      <div className="cupping-sheet mx-auto w-full max-w-3xl space-y-3 px-3 pt-3 sm:px-5">
        {coffees.map((coffee, index) => {
          const draft = drafts[coffee.id] ?? emptyDraft(formType);
          const complete = isDraftComplete(draft);
          const scored = draft.score != null || Object.values(draft.payload).some((value) => typeof value === "number");
          return (
            <section key={coffee.id} id={`coffee-${coffee.id}`} className={cn("scroll-mt-28", error && !complete && "rounded-2xl ring-2 ring-danger/40")}>
              <article className="card overflow-hidden">
                <CoffeeInformationCard
                  lot={coffee}
                  position={index + 1}
                  formType={formType}
                  rating={scored ? draft.score : null}
                  total={scored ? draft.total : null}
                />
                <div className="p-3 sm:p-4">
                  <ProtocolFields coffeeId={coffee.id} draft={draft} onChange={(partial) => update(coffee.id, partial)} />
                </div>
              </article>
            </section>
          );
        })}
      </div>
      <div className="h-[calc(5.5rem+var(--keyboard-inset,0px))]" aria-hidden="true" />
      <div className="cupping-save sticky z-20 border-t border-line bg-paper/90 backdrop-blur-md">
        <div className="mx-auto w-full max-w-3xl space-y-2 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-5">
          {error ? <Alert>{error}</Alert> : null}
          <Button className="min-h-11 w-full text-base sm:min-h-12" onClick={handleSave} disabled={pending}>
            {pending ? "Saving…" : "Save and submit"}
          </Button>
        </div>
      </div>
    </div>
  );
}
