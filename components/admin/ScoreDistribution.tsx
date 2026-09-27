import { RATING_OPTIONS } from "@/lib/ratings";
import type { ScoreDistribution as Counts } from "@/lib/analytics";

export function ScoreDistribution({ title, counts }: { title: string; counts: Counts }) {
  const total = RATING_OPTIONS.reduce((sum, option) => sum + counts[option.score], 0);
  const max = Math.max(1, ...RATING_OPTIONS.map((option) => counts[option.score]));
  return (
    <section className="card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h3>
        <p className="text-xs text-ink-mute tabular">{total} scores</p>
      </div>
      <ul className="mt-4 space-y-3">
        {[...RATING_OPTIONS].reverse().map((option) => {
          const count = counts[option.score];
          return (
            <li key={option.score} className="text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-ink">
                  <span className="mr-2 text-ink-mute tabular">{option.score}</span>
                  {option.label}
                </span>
                <span className="text-ink-soft tabular">{count}</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-paper-2">
                <div className="h-full rounded-full bg-ink transition-[width] duration-500" style={{ width: `${(count / max) * 100}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
