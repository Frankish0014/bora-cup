import { RATING_OPTIONS, type RatingScore } from "@/lib/ratings";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/* Ordinal palette for the 1–5 scale: light warm gray up to deep green. */
export const RATING_COLORS: Record<RatingScore, string> = {
  1: "#e4e7ec",
  2: "#c9ead8",
  3: "#8fd4ad",
  4: "#3dae6e",
  5: "#1f9d55",
};

export const SERIES_COLORS = ["#1f9d55", "#167a42", "#8fd4ad", "#5e656e", "#c5cad3", "#e4e7ec"];

export function ChartCard({
  title,
  description,
  aside,
  children,
  className,
}: {
  title: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("@container card flex min-w-0 flex-col p-4 sm:p-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h3>
          {description ? <p className="mt-0.5 text-xs leading-5 text-ink-mute">{description}</p> : null}
        </div>
        {aside}
      </div>
      <div className="mt-4 flex-1">{children}</div>
    </section>
  );
}

export function ChartEmpty({ children = "No data yet." }: { children?: string }) {
  return <p className="grid h-40 place-items-center text-sm text-ink-mute">{children}</p>;
}

/* ---------- Donut ---------- */

export function DonutChart({
  slices,
  total,
  centerLabel,
  centerValue,
}: {
  slices: Array<{ label: string; value: number; color: string }>;
  total?: number;
  centerLabel: string;
  centerValue: string;
}) {
  const sum = total ?? slices.reduce((acc, slice) => acc + slice.value, 0);
  const radius = 44;
  const stroke = 14;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-stretch gap-4 @min-[26rem]:flex-row @min-[26rem]:items-center">
      <svg viewBox="0 0 120 120" className="mx-auto h-36 w-36 shrink-0 @min-[26rem]:mx-0 @min-[26rem]:h-40 @min-[26rem]:w-40" role="img" aria-label={`${centerLabel}: ${centerValue}`}>
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#ecebe6" strokeWidth={stroke} />
        {sum > 0
          ? slices.map((slice) => {
              const length = (slice.value / sum) * circumference;
              const dash = `${Math.max(length - 1.5, 0)} ${circumference - Math.max(length - 1.5, 0)}`;
              const element = (
                <circle
                  key={slice.label}
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={stroke}
                  strokeDasharray={dash}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 60 60)"
                  strokeLinecap="butt"
                />
              );
              offset += length;
              return element;
            })
          : null}
        <text x="60" y="57" textAnchor="middle" className="fill-ink font-display" style={{ fontSize: 20 }}>
          {centerValue}
        </text>
        <text x="60" y="73" textAnchor="middle" className="fill-ink-mute" style={{ fontSize: 8.5, fontWeight: 500 }}>
          {centerLabel}
        </text>
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-center gap-2">
            <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: slice.color }} />
            <span className="min-w-0 flex-1 truncate text-ink">{slice.label}</span>
            <span className="shrink-0 text-ink-soft tabular">{slice.value}</span>
            <span className="w-10 shrink-0 text-right text-xs text-ink-mute tabular">{sum > 0 ? `${Math.round((slice.value / sum) * 100)}%` : "—"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Horizontal bars ---------- */

export function HorizontalBars({
  rows,
  color = "#1f9d55",
  format = (value: number) => value.toLocaleString("en-US"),
  max,
}: {
  rows: Array<{ label: string; value: number; hint?: string; color?: string }>;
  color?: string;
  format?: (value: number) => string;
  max?: number;
}) {
  if (rows.length === 0) return <ChartEmpty />;
  const top = max ?? Math.max(1, ...rows.map((row) => row.value));
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0">
              <span className="block truncate text-ink">{row.label}</span>
              {row.hint ? <span className="block truncate text-xs text-ink-mute">{row.hint}</span> : null}
            </span>
            <span className="shrink-0 font-medium text-ink tabular">{format(row.value)}</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-paper-2">
            <div className="h-full rounded-full" style={{ width: `${(row.value / top) * 100}%`, background: row.color ?? color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Vertical bars ---------- */

export function VerticalBars({
  points,
  color = "#1f9d55",
  height = 160,
}: {
  points: Array<{ label: string; value: number }>;
  color?: string;
  height?: number;
}) {
  if (points.length === 0) return <ChartEmpty />;
  const max = Math.max(1, ...points.map((point) => point.value));
  const ticks = [0, 0.5, 1].map((fraction) => Math.round(max * fraction));
  const labelStep = points.length > 8 ? 2 : 1;
  return (
    <div className="flex gap-3">
      <div className="flex flex-col justify-between py-0.5 text-right text-[10px] text-ink-mute tabular" style={{ height }}>
        {[...ticks].reverse().map((tick, index) => (
          <span key={`${tick}-${index}`}>{tick}</span>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className="relative flex items-end gap-1.5 border-b border-line" style={{ height }}>
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-line" />
          {points.map((point) => (
            <div key={point.label} className="group relative flex h-full flex-1 flex-col justify-end" title={`${point.label}: ${point.value}`}>
              <span className="mb-1 text-center text-[10px] text-ink-soft tabular opacity-0 transition-opacity group-hover:opacity-100">{point.value}</span>
              <div className="w-full rounded-t-[3px]" style={{ height: `${Math.max((point.value / max) * 100, point.value > 0 ? 2 : 0)}%`, background: color }} />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex gap-1 overflow-hidden">
          {points.map((point, index) => (
            <span key={`${point.label}-${index}`} className={cn("min-w-0 flex-1 truncate text-center text-[10px] text-ink-mute", index % labelStep !== 0 && "invisible")}>
              {point.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Stacked 100% bar for the rating scale ---------- */

export function RatingStack({ label, counts }: { label: string; counts: Record<RatingScore, number> }) {
  const total = RATING_OPTIONS.reduce((sum, option) => sum + counts[option.score], 0);
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-ink">{label}</span>
        <span className="text-xs text-ink-mute tabular">{total} scores</span>
      </div>
      <div className="mt-1.5 flex h-3 w-full overflow-hidden rounded-full bg-paper-2">
        {total > 0
          ? RATING_OPTIONS.map((option) => (
              <span
                key={option.score}
                title={`${option.label}: ${counts[option.score]}`}
                style={{ width: `${(counts[option.score] / total) * 100}%`, background: RATING_COLORS[option.score] }}
              />
            ))
          : null}
      </div>
    </div>
  );
}

export function RatingLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-soft">
      {RATING_OPTIONS.map((option) => (
        <li key={option.score} className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ background: RATING_COLORS[option.score] }} />
          {option.score} {option.label}
        </li>
      ))}
    </ul>
  );
}

/* ---------- KPI tile ---------- */

export function Kpi({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div className={cn("card min-w-0 p-4 sm:p-5", accent ? "bg-leaf text-white" : "")}>
      <p className={cn("text-xs font-medium", accent ? "text-white/80" : "text-ink-mute")}>{label}</p>
      <p className={cn("mt-2 font-display text-[1.75rem] leading-none tabular sm:text-[2rem]", accent ? "text-white" : "text-ink")}>{value}</p>
      {hint ? <p className={cn("mt-1.5 text-xs leading-5", accent ? "text-white/70" : "text-ink-mute")}>{hint}</p> : null}
    </div>
  );
}
