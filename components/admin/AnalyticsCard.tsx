import { buttonClasses, buttonSm } from "@/components/ui/button";
import { formatAverage } from "@/lib/ratings";
import Link from "next/link";

export function AnalyticsCard({
  href,
  title,
  sessionName,
  evaluations,
  score,
}: {
  href: string;
  title: string;
  sessionName: string;
  evaluations: number;
  score: number | null;
}) {
  return (
    <li className="card grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="min-w-0">
        <h3 className="truncate text-[17px] font-semibold tracking-tight text-ink">{title}</h3>
        <p className="mt-0.5 text-sm text-ink-soft">
          {sessionName} · {evaluations} {evaluations === 1 ? "evaluation" : "evaluations"}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Average label="Rating" value={score} />
        <Link href={href} className={buttonClasses("secondary", `${buttonSm} ml-1`)}>
          Details
        </Link>
      </div>
    </li>
  );
}

function Average({ label, value }: { label: string; value: number | null }) {
  return (
    <span className="min-w-[4.5rem] rounded-lg bg-paper px-3 py-2 text-center">
      <span className="block text-[11px] font-medium text-ink-mute">{label}</span>
      <span className="block font-display text-xl leading-none text-ink tabular">{formatAverage(value)}</span>
    </span>
  );
}
