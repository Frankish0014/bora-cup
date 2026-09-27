import { BrandMark } from "@/components/ui/brand";
import { Button, buttonSm } from "@/components/ui/button";
import { Alert } from "@/components/ui/field";
import { isDraftComplete, type Draft } from "@/lib/cupping";
import { ratingLabel } from "@/lib/ratings";
import { cn } from "@/lib/utils";
import type { CoffeeLot } from "@/types/domain";

export function CuppingReview({
  coffees,
  drafts,
  pending,
  error,
  onEdit,
  onBack,
  onSubmit,
}: {
  coffees: CoffeeLot[];
  drafts: Record<string, Draft>;
  pending: boolean;
  error: string | null;
  onEdit: (index: number) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const completed = coffees.filter((coffee) => isDraftComplete(drafts[coffee.id])).length;
  return (
    <div className="mx-auto min-h-dvh w-full max-w-3xl px-3 pt-6 sm:px-5 sm:pt-10">
      <div className="flex items-center gap-3">
        <BrandMark className="h-5 w-5" />
        <p className="text-xs text-ink-mute">Best of Rwanda</p>
      </div>
      <h2 id="coffee-title" tabIndex={-1} className="mt-10 font-display text-[40px] leading-[1.05] text-ink outline-none sm:text-5xl">
        Review your scores
      </h2>
      <p className="mt-4 text-[17px] leading-7 text-ink-soft">
        {completed} of {coffees.length} coffees scored. Check everything looks right, then submit.
      </p>
      {error ? (
        <div className="mt-6">
          <Alert>{error}</Alert>
        </div>
      ) : null}

      <ol className="mt-8 space-y-3">
        {coffees.map((coffee, index) => {
          const draft = drafts[coffee.id];
          const complete = isDraftComplete(draft);
          return (
            <li key={coffee.id} className={cn("card p-5", complete ? "" : "border-danger/30")}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-ink-mute tabular">Coffee No. {index + 1}</p>
                  <h3 className="mt-1 truncate text-[17px] font-semibold tracking-tight text-ink">{coffee.lot_name}</h3>
                </div>
                <Button variant="secondary" className={cn(buttonSm, "shrink-0")} onClick={() => onEdit(index)}>
                  Edit
                </Button>
              </div>
              <dl className="mt-4">
                <Score label="Rating" text={complete ? ratingLabel(draft.score) : "Not rated"} missing={!complete} />
              </dl>
              <Notes draft={draft} />
            </li>
          );
        })}
      </ol>

      <div className="h-20" aria-hidden="true" />
      <div className="sticky bottom-0 z-20 -mx-3 border-t border-line bg-paper/90 px-3 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:-mx-5 sm:px-5">
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="min-h-13 px-5" onClick={onBack} disabled={pending}>
            Back
          </Button>
          <Button className="min-h-13 flex-1 text-base" onClick={onSubmit} disabled={pending}>
            {pending ? "Submitting…" : "Submit cupping"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Score({ label, text, missing }: { label: string; text: string; missing: boolean }) {
  return (
    <div className="rounded-lg bg-paper px-3 py-2">
      <dt className="text-[11px] font-medium text-ink-mute">{label}</dt>
      <dd className={cn("mt-0.5 truncate text-sm font-medium", missing ? "text-danger" : "text-ink")}>{text}</dd>
    </div>
  );
}

function Notes({ draft }: { draft: Draft | undefined }) {
  const items = [
    ["Aroma", draft?.aroma.trim() ?? ""],
    ["Flavor", draft?.flavor.trim() ?? ""],
    ["Overall", draft?.overall.trim() ?? ""],
  ].filter((item): item is [string, string] => item[1].length > 0);
  if (items.length === 0) return null;
  return (
    <dl className="mt-4 space-y-3 border-t border-line pt-3">
      {items.map(([label, text]) => (
        <div key={label}>
          <dt className="text-[11px] font-medium text-ink-mute">{label}</dt>
          <dd className="mt-0.5 text-sm leading-6 text-ink-soft whitespace-pre-wrap">{text}</dd>
        </div>
      ))}
    </dl>
  );
}
