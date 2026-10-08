"use client";

import { CoffeeInformationCard } from "@/components/cupping/CoffeeInformationCard";
import { CommentsField } from "@/components/cupping/CommentsField";
import { CuppingProgress } from "@/components/cupping/CuppingProgress";
import { RatingSelector } from "@/components/cupping/RatingSelector";
import { SessionHeader } from "@/components/cupping/SessionHeader";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/field";
import { saveAndSubmitCupping } from "@/lib/actions/participant";
import { INCOMPLETE_SUBMISSION_MESSAGE, isDraftComplete, type Draft } from "@/lib/cupping";
import { draftsFromSaved, mergeUnsavedDrafts, parseStoredDrafts, readDraftSnapshot, writeDrafts } from "@/lib/draft-storage";
import { cn } from "@/lib/utils";
import type { CoffeeLot } from "@/types/domain";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

type SavedEvaluation = {
  coffee_lot_id: string;
  overall_score: number;
  aroma_note: string | null;
  flavor_note: string | null;
  overall_note: string | null;
};

export function CuppingExperience({
  slug,
  sessionName,
  participantSessionId,
  coffees,
  evaluations,
}: {
  slug: string;
  sessionName: string;
  participantSessionId: string;
  coffees: CoffeeLot[];
  evaluations: SavedEvaluation[];
}) {
  const router = useRouter();
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("snap-y", "snap-proximity");
    return () => root.classList.remove("snap-y", "snap-proximity");
  }, []);
  const [overrides, setOverrides] = useState<Record<string, Partial<Draft>>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const snapshot = useSyncExternalStore(
    () => () => {},
    () => readDraftSnapshot(participantSessionId),
    () => "",
  );
  const drafts = useMemo(() => {
    const base = draftsFromSaved(coffees.map((coffee) => coffee.id), evaluations);
    const savedIds = new Set(evaluations.map((evaluation) => evaluation.coffee_lot_id));
    const restored = mergeUnsavedDrafts(base, parseStoredDrafts(snapshot), savedIds);
    const next = { ...restored };
    for (const [id, partial] of Object.entries(overrides)) {
      if (next[id]) next[id] = { ...next[id], ...partial };
    }
    return next;
  }, [coffees, evaluations, overrides, snapshot]);

  function update(coffeeId: string, partial: Partial<Draft>) {
    const nextOverrides = { ...overrides, [coffeeId]: { ...overrides[coffeeId], ...partial } };
    setOverrides(nextOverrides);
    const nextDrafts = { ...drafts, [coffeeId]: { ...drafts[coffeeId], ...partial } };
    writeDrafts(participantSessionId, nextDrafts);
    setError(null);
  }

  async function handleSave() {
    const firstIncomplete = coffees.find((coffee) => !isDraftComplete(drafts[coffee.id]));
    if (firstIncomplete) {
      setError(INCOMPLETE_SUBMISSION_MESSAGE);
      document.getElementById(`coffee-${firstIncomplete.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setPending(true);
    const result = await saveAndSubmitCupping({
      participantSessionId,
      evaluations: coffees.map((coffee) => {
        const draft = drafts[coffee.id];
        return {
          coffeeLotId: coffee.id,
          score: draft.score,
          aroma: draft.aroma,
          flavor: draft.flavor,
          overall: draft.overall,
        };
      }),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.push(`/session/${slug}/complete`);
  }

  if (coffees.length === 0) return null;

  return (
    <div className="min-h-dvh">
      <SessionHeader sessionName={sessionName}>
        <CuppingProgress done={coffees.map((coffee) => isDraftComplete(drafts[coffee.id]))} />
      </SessionHeader>
      <div className="mx-auto w-full max-w-3xl space-y-3 px-3 pt-3 sm:px-5">
        {coffees.map((coffee, index) => {
          const draft = drafts[coffee.id];
          const complete = isDraftComplete(draft);
          return (
            <section key={coffee.id} id={`coffee-${coffee.id}`} className={cn("snap-start scroll-mt-24", error && !complete && "rounded-2xl ring-2 ring-danger/40")}>
              <article className="card overflow-hidden">
                <CoffeeInformationCard lot={coffee} position={index + 1} />
                <div className="space-y-2.5 p-3 sm:space-y-4 sm:p-4">
                  <CommentsField
                    id={`${coffee.id}-aroma`}
                    label="Aroma"
                    placeholder="Aroma notes"
                    value={draft?.aroma ?? ""}
                    onChange={(aroma) => update(coffee.id, { aroma })}
                  />
                  <CommentsField
                    id={`${coffee.id}-flavor`}
                    label="Flavor"
                    placeholder="Flavor notes"
                    value={draft?.flavor ?? ""}
                    onChange={(flavor) => update(coffee.id, { flavor })}
                  />
                  <CommentsField
                    id={`${coffee.id}-overall`}
                    label="Overall"
                    placeholder="Overall impression"
                    value={draft?.overall ?? ""}
                    onChange={(overall) => update(coffee.id, { overall })}
                  />
                  <RatingSelector label="Rating" group={`${coffee.id}-rating`} value={draft?.score ?? null} onChange={(score) => update(coffee.id, { score })} />
                </div>
              </article>
            </section>
          );
        })}
      </div>
      <div className="h-16 sm:h-20" aria-hidden="true" />
      <div className="sticky bottom-0 z-20 border-t border-line bg-paper/90 backdrop-blur-md">
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
