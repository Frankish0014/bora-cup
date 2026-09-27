import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const tones = {
  neutral: "bg-paper-2 text-ink-soft",
  ember: "bg-ink text-white",
  leaf: "bg-leaf-soft text-leaf-deep",
  dark: "bg-ink text-white",
  outline: "border border-line-strong text-ink-soft",
};

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: keyof typeof tones; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap", tones[tone], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge tone={active ? "leaf" : "neutral"}>
      <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-leaf" : "bg-ink-mute")} />
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}
