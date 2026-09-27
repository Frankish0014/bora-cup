import { cn } from "@/lib/utils";

export function CuppingProgress({ current, total }: { current: number; total: number }) {
  const segments = Array.from({ length: Math.max(total, 1) }, (_, index) => index + 1);
  return (
    <div
      className="mt-3"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={Math.max(total, 1)}
      aria-label={`Coffee ${current} of ${total}`}
    >
      <div className="flex items-baseline justify-between text-xs">
        <p className="font-medium text-ink tabular">
          Coffee {current} <span className="font-normal text-ink-mute">of {total}</span>
        </p>
        <p className="text-ink-mute tabular">{Math.round(((current - 1) / Math.max(total, 1)) * 100)}% done</p>
      </div>
      <div className="mt-2 flex gap-1" aria-hidden="true">
        {segments.map((segment) => (
          <span
            key={segment}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              segment < current ? "bg-leaf" : segment === current ? "bg-leaf/50" : "bg-paper-3",
            )}
          />
        ))}
      </div>
    </div>
  );
}
