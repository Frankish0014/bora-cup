"use client";

import { Brand } from "@/components/ui/brand";
import { buttonClasses, buttonSm } from "@/components/ui/button";
import { CopyLink } from "@/components/ui/CopyLink";
import { formatNotes } from "@/lib/cupping";
import { ratingScale } from "@/lib/ratings";
import { coffeeReview, lotStation, padCup, reviewSummary, type ReviewCupper, type ReviewLot, type ReviewScore, type SessionReview } from "@/lib/review";
import { cn, formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

type View = "sheet" | "coffees" | "cuppers";

export function ReviewReport({ review, reviewUrl, tableHref }: { review: SessionReview; reviewUrl: string; tableHref: string }) {
  const [view, setView] = useState<View>("sheet");
  const summary = reviewSummary(review);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-wrap items-center justify-between gap-3 no-print">
        <Brand compact name={review.eventName} />
        <div className="flex flex-wrap items-center gap-2">
          <CopyLink url={reviewUrl} label="Copy review link" />
          <Link href={tableHref} className={buttonClasses("ghost", buttonSm)}>
            Table setup
          </Link>
        </div>
      </header>

      <section className="mt-10 sm:mt-14">
        <p className="eyebrow">Session review</p>
        <h1 className="mt-2 max-w-3xl font-display text-[40px] leading-[1.05] text-ink sm:text-5xl">{review.sessionName}</h1>
        <p className="mt-3 text-[15px] text-ink-soft">
          {review.eventName}
          {review.category ? ` · ${review.category}` : ""}
        </p>
        <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Cuppers" value={String(summary.cupperCount)} hint={`${summary.submitted} submitted`} />
          <Stat label="Cups" value={String(review.lots.length)} hint="Table order" />
          <Stat label="Ratings" value={String(summary.ratedCount)} hint="From submitted sheets" />
          <Stat label="Average" value={summary.averageHundred == null ? "—" : summary.averageHundred.toFixed(1)} hint="Submitted only" />
        </dl>
      </section>

      {review.cuppers.length === 0 ? (
        <p className="card mt-10 px-6 py-16 text-center text-[15px] text-ink-soft">No cupping notes yet. This page fills in as people rate the table.</p>
      ) : (
        <>
          <nav className="mt-10 flex flex-wrap gap-1 rounded-full bg-paper-2 p-1 no-print" aria-label="Review sections">
            <ViewButton current={view} id="sheet" onClick={setView}>
              Score sheet
            </ViewButton>
            <ViewButton current={view} id="coffees" onClick={setView}>
              By coffee
            </ViewButton>
            <ViewButton current={view} id="cuppers" onClick={setView}>
              By cupper
            </ViewButton>
          </nav>

          <div className={view === "sheet" ? "mt-6" : "mt-6 no-screen"}>
            <ScoreSheet review={review} />
          </div>
          <div className={view === "coffees" ? "mt-6" : "mt-6 no-screen"}>
            <ByCoffee review={review} />
          </div>
          <div className={view === "cuppers" ? "mt-6" : "mt-6 no-screen"}>
            <ByCupper review={review} />
          </div>
        </>
      )}

      <p className="mt-12 max-w-xl text-xs leading-5 text-ink-mute">
        This link is for reviewing recorded notes and scores. It is not a public ranking page. Share it only with people who should see this table.
      </p>
    </main>
  );
}

function ViewButton({
  current,
  id,
  onClick,
  children,
}: {
  current: View;
  id: View;
  onClick: (view: View) => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={cn(
        "min-h-10 rounded-full px-4 text-sm font-medium transition-colors",
        current === id ? "bg-foam text-ink shadow-card" : "text-ink-soft hover:text-ink",
      )}
      aria-current={current === id ? "page" : undefined}
    >
      {children}
    </button>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="card px-4 py-4">
      <dt className="text-xs font-medium text-ink-mute">{label}</dt>
      <dd className="mt-1 font-display text-3xl tabular text-ink">{value}</dd>
      <p className="mt-1 text-xs text-ink-mute">{hint}</p>
    </div>
  );
}

function ScoreSheet({ review }: { review: SessionReview }) {
  return (
    <section className="print-break">
      <h2 className="text-lg font-semibold tracking-tight text-ink">Score sheet</h2>
      <p className="mt-1 text-sm text-ink-soft">Cups run left to right, matching the table.</p>
      <div className="mt-4 overflow-x-auto rounded-[1.35rem] border border-line bg-foam shadow-card">
        <table className="min-w-[640px] w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="sticky left-0 bg-foam px-4 py-3 font-medium text-ink-soft">Cupper</th>
              {review.lots.map((lot) => (
                <th key={lot.id} className="min-w-[8.5rem] px-3 py-3 font-medium text-ink-soft">
                  <span className="block text-[11px] tabular text-ink-mute">Cup {padCup(lot.cup)}</span>
                  <LotHeading lot={lot} compact />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {review.cuppers.map((cupper) => (
              <tr key={cupper.id} className="border-b border-line last:border-0">
                <th className="sticky left-0 bg-foam px-4 py-3 text-left font-medium text-ink">
                  {cupper.name}
                  <span className="mt-0.5 block text-xs font-normal text-ink-mute">
                    {cupper.country}
                    {cupper.status === "in_progress" ? " · in progress" : ""}
                  </span>
                </th>
                {cupper.scores.map((score) => (
                  <td key={score.coffeeId} className="px-3 py-3 align-top tabular">
                    <ScoreCell score={score} />
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-paper">
              <th className="sticky left-0 bg-paper px-4 py-3 text-left text-xs font-medium text-ink-mute">Average</th>
              {review.lots.map((lot) => {
                const hundred = coffeeReview(review, lot.id).averageHundred;
                return (
                  <td key={lot.id} className="px-3 py-3 font-semibold tabular text-ink">
                    {hundred == null ? "—" : hundred.toFixed(1)}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ByCoffee({ review }: { review: SessionReview }) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-ink">By coffee</h2>
        <p className="mt-1 text-sm text-ink-soft">Each cup, with every cupper’s rating and notes.</p>
      </div>
      {review.lots.map((lot) => {
        const group = coffeeReview(review, lot.id);
        const facts = [lot.process, lot.variety, lot.district].filter(Boolean);
        return (
          <article key={lot.id} className="card print-break p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-medium tracking-wide text-ink-mute tabular">Cup {padCup(lot.cup)}</p>
                <h3 className="mt-1 text-xl font-semibold tracking-tight text-ink">{lot.lotName}</h3>
                {lotStation(lot) ? <p className="mt-1 text-sm text-ink-soft">{lotStation(lot)}</p> : null}
                {facts.length > 0 ? <p className="mt-0.5 text-sm text-ink-mute">{facts.join(" · ")}</p> : null}
              </div>
              <div className="text-right">
                <p className="font-display text-3xl tabular text-ink">{group.averageHundred == null ? "—" : group.averageHundred.toFixed(1)}</p>
                <p className="text-xs text-ink-mute">{group.entries.length} rating{group.entries.length === 1 ? "" : "s"}</p>
              </div>
            </div>
            {group.entries.length === 0 ? (
              <p className="mt-5 text-sm text-ink-mute">No ratings yet.</p>
            ) : (
              <ul className="mt-5 divide-y divide-line">
                {group.entries.map(({ cupper, score }) => (
                  <li key={cupper.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <p className="font-medium text-ink">
                        {cupper.name}
                        <span className="ml-2 text-sm font-normal text-ink-mute">{cupper.country}</span>
                      </p>
                      <ScoreCell score={score} align="right" />
                    </div>
                    <Notes score={score} />
                  </li>
                ))}
              </ul>
            )}
          </article>
        );
      })}
    </section>
  );
}

function ByCupper({ review }: { review: SessionReview }) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-ink">By cupper</h2>
        <p className="mt-1 text-sm text-ink-soft">One sheet per person, in the same cup order as the table.</p>
      </div>
      {review.cuppers.map((cupper) => (
        <article key={cupper.id} className="card print-break p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-ink">{cupper.name}</h3>
              <p className="mt-1 text-sm text-ink-soft">
                {[cupper.country, cupper.organization, cupper.role].filter(Boolean).join(" · ")}
              </p>
            </div>
            <p className="text-xs text-ink-mute">
              {cupper.status === "completed" ? "Submitted" : "In progress"}
              {cupper.updatedAt ? ` · ${formatDateTime(cupper.updatedAt)}` : ""}
              {` · ${cupper.formLabel}`}
            </p>
          </div>
          <ol className="mt-5 divide-y divide-line">
            {review.lots.map((lot, index) => {
              const score = cupper.scores[index];
              return (
                <li key={lot.id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-ink-mute tabular">Cup {padCup(lot.cup)}</p>
                    <p className="font-medium text-ink">{lot.lotName}</p>
                    {lotStation(lot) ? <p className="text-sm text-ink-soft">{lotStation(lot)}</p> : null}
                    <Notes score={score} />
                  </div>
                  <ScoreCell score={score} align="right" />
                </li>
              );
            })}
          </ol>
        </article>
      ))}
    </section>
  );
}

function LotHeading({ lot, compact = false }: { lot: ReviewLot; compact?: boolean }) {
  const station = lotStation(lot);
  return (
    <>
      <span className={cn("mt-0.5 block font-medium leading-snug text-ink", compact && "max-w-[10rem] whitespace-normal")}>{lot.lotName}</span>
      {station ? <span className={cn("mt-0.5 block font-normal leading-snug text-ink-mute", compact ? "max-w-[10rem] text-[11px]" : "text-sm")}>{station}</span> : null}
    </>
  );
}

function ScoreCell({ score, align = "left" }: { score: ReviewScore | undefined; align?: "left" | "right" }) {
  if (!score || score.rating == null) {
    return <span className={cn("text-ink-mute", align === "right" && "text-right")}>—</span>;
  }
  const label = ratingScale(score.rating);
  return (
    <span className={cn("block", align === "right" && "text-right")}>
      <span className="font-semibold tabular text-ink">{score.hundred == null ? "—" : score.hundred.toFixed(1)}</span>
      {label ? <span className="mt-0.5 block text-xs text-ink-mute">{label}</span> : null}
    </span>
  );
}

function Notes({ score }: { score: ReviewScore | undefined }) {
  const text = formatNotes({ aroma: score?.aroma, flavor: score?.flavor, overall: score?.overall });
  if (!text) return null;
  return <p className="mt-2 max-w-2xl text-sm leading-6 whitespace-pre-wrap text-ink-soft">{text}</p>;
}
