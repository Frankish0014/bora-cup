"use client";

import { CoffeeInformationCard } from "@/components/cupping/CoffeeInformationCard";
import { CommentsField } from "@/components/cupping/CommentsField";
import { CuppingNavigation } from "@/components/cupping/CuppingNavigation";
import { CuppingProgress } from "@/components/cupping/CuppingProgress";
import { CuppingReview } from "@/components/cupping/CuppingReview";
import { RatingSelector } from "@/components/cupping/RatingSelector";
import { SessionHeader } from "@/components/cupping/SessionHeader";
import { Alert } from "@/components/ui/field";
import { saveEvaluation, submitCupping } from "@/lib/actions/participant";
import { INCOMPLETE_RATINGS_MESSAGE, INCOMPLETE_SUBMISSION_MESSAGE, isDraftComplete, type Draft } from "@/lib/cupping";
import { draftsFromSaved, mergeUnsavedDrafts, parseStoredDrafts, readDraftSnapshot, writeDrafts } from "@/lib/draft-storage";
import { clampIndex } from "@/lib/utils";
import type { CoffeeLot } from "@/types/domain";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

type SavedEvaluation = {
  coffee_lot_id: string;
  overall_score: number;
  comments: string | null;
};

export function CuppingExperience({
  slug,
  sessionName,
  participantSessionId,
  coffees,
  evaluations,
  initialIndex,
  initialView,
}: {
  slug: string;
  sessionName: string;
  participantSessionId: string;
  coffees: CoffeeLot[];
  evaluations: SavedEvaluation[];
  initialIndex: number;
  initialView: "cup" | "review";
}) {
  const router = useRouter();
  const [index, setIndex] = useState(() => clampIndex(initialIndex, coffees.length));
  const [view, setView] = useState(initialView);
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

  useEffect(() => {
    const title = document.getElementById("coffee-title");
    if (title instanceof HTMLElement) title.focus();
    window.scrollTo(0, 0);
  }, [index, view]);

  const coffee = coffees[index];
  const draft = coffee ? drafts[coffee.id] : undefined;

  function update(partial: Partial<Draft>) {
    if (!coffee) return;
    const nextOverrides = { ...overrides, [coffee.id]: { ...overrides[coffee.id], ...partial } };
    setOverrides(nextOverrides);
    const nextDrafts = { ...drafts, [coffee.id]: { ...drafts[coffee.id], ...partial } };
    writeDrafts(participantSessionId, nextDrafts);
    setError(null);
  }

  function showCoffee(nextIndex: number) {
    const safe = clampIndex(nextIndex, coffees.length);
    setView("cup");
    setIndex(safe);
    setError(null);
    router.replace(`/session/${slug}/cup?i=${safe}`, { scroll: false });
  }

  async function handleNext() {
    if (!coffee || !draft || !isDraftComplete(draft)) {
      setError(INCOMPLETE_RATINGS_MESSAGE);
      return;
    }
    setPending(true);
    const result = await saveEvaluation({
      participantSessionId,
      coffeeLotId: coffee.id,
      score: draft.score,
      aroma: draft.aroma,
      flavor: draft.flavor,
      overall: draft.overall,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    if (index < coffees.length - 1) {
      showCoffee(index + 1);
      return;
    }
    setView("review");
    setError(null);
    router.replace(`/session/${slug}/cup?view=review`, { scroll: false });
  }

  async function handleSubmit() {
    const incomplete = coffees.some((item) => !isDraftComplete(drafts[item.id]));
    if (incomplete) {
      setError(INCOMPLETE_SUBMISSION_MESSAGE);
      return;
    }
    setPending(true);
    const result = await submitCupping(participantSessionId);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.push(`/session/${slug}/complete`);
  }

  if (!coffee) return null;

  if (view === "review") {
    return (
      <CuppingReview
        coffees={coffees}
        drafts={drafts}
        pending={pending}
        error={error}
        onEdit={showCoffee}
        onBack={() => showCoffee(coffees.length - 1)}
        onSubmit={handleSubmit}
      />
    );
  }

  return (
    <div className="min-h-dvh">
      <SessionHeader sessionName={sessionName}>
        <CuppingProgress current={index + 1} total={coffees.length} />
      </SessionHeader>
      <div key={coffee.id} className="animate-rise mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-3 pt-4 sm:px-5 lg:grid-cols-2 lg:items-start">
        <div className="lg:sticky lg:top-28">
          <CoffeeInformationCard lot={coffee} position={index + 1} />
        </div>
        <div className="space-y-4">
          <CommentsField
            id="aroma"
            label="Aroma"
            hint="What do you notice in the aroma?"
            placeholder="Jasmine, citrus, brown sugar…"
            value={draft?.aroma ?? ""}
            onChange={(aroma) => update({ aroma })}
          />
          <CommentsField
            id="flavor"
            label="Flavor"
            hint="What do you notice in the flavor?"
            placeholder="Stone fruit, cocoa, black tea…"
            value={draft?.flavor ?? ""}
            onChange={(flavor) => update({ flavor })}
          />
          <CommentsField
            id="overall"
            label="Overall"
            hint="How does the coffee come together?"
            placeholder="Clean, sweet, and lingering…"
            value={draft?.overall ?? ""}
            onChange={(overall) => update({ overall })}
          />
          <RatingSelector label="Rating" value={draft?.score ?? null} onChange={(score) => update({ score })} />
          {error ? <Alert>{error}</Alert> : null}
        </div>
      </div>
      <div className="h-24" aria-hidden="true" />
      <div className="sticky bottom-0 z-20 border-t border-line bg-paper/90 backdrop-blur-md">
        <div className="mx-auto w-full max-w-6xl px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
          <CuppingNavigation isFirst={index === 0} pending={pending} onBack={() => showCoffee(index - 1)} onNext={handleNext} />
        </div>
      </div>
    </div>
  );
}
