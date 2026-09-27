import { cn } from "@/lib/utils";

/** A small filled circle: the cup seen from above. */
export function BrandMark({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-grid h-6 w-6 shrink-0 place-items-center rounded-full",
        tone === "light" ? "bg-white text-leaf" : "bg-leaf text-white",
        className,
      )}
    >
      <span className={cn("block h-2 w-2 rounded-full", tone === "light" ? "bg-ink" : "bg-white")} />
    </span>
  );
}

export function Brand({
  tone = "dark",
  compact = false,
  className,
}: {
  tone?: "dark" | "light";
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark tone={tone} />
      <span className={cn("text-[15px] font-semibold tracking-tight", tone === "light" ? "text-white" : "text-ink")}>
        Best of Rwanda
        {compact ? null : <span className={cn("font-normal", tone === "light" ? "text-white/70" : "text-ink-mute")}> · Cup Tour</span>}
      </span>
    </span>
  );
}
