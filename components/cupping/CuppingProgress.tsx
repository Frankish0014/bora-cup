import { cn } from "@/lib/utils";

export function CuppingProgress({ done }: { done: boolean[] }) {
  const total = Math.max(done.length, 1);
  const completed = done.filter(Boolean).length;
  return (
    <div className="mt-3" role="progressbar" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={total} aria-label={`${completed} of ${done.length} coffees complete`}>
      <div className="flex items-baseline justify-between text-xs">
        <p className="font-medium text-ink tabular">
          {completed} <span className="font-normal text-ink-mute">of {done.length} complete</span>
        </p>
        <p className="text-ink-mute tabular">{Math.round((completed / total) * 100)}%</p>
      </div>
      <div className="mt-2 flex gap-1" aria-hidden="true">
        {done.map((complete, index) => (
          <span key={index} className={cn("h-1 flex-1 rounded-full transition-colors duration-300", complete ? "bg-leaf" : "bg-paper-3")} />
        ))}
      </div>
    </div>
  );
}
