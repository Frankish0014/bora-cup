import { BrandMark } from "@/components/ui/brand";
import type { ReactNode } from "react";

export function SessionHeader({
  sessionName,
  eventName,
  children,
}: {
  sessionName: string;
  eventName?: string | null;
  children?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 px-3 pt-3 sm:px-5">
      <div className="mx-auto w-full max-w-6xl rounded-2xl border border-line bg-foam px-3 py-2 shadow-card sm:px-4">
        <div className="flex items-center gap-3">
          <BrandMark className="h-7 w-7" />
          <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight text-ink">{sessionName}</h1>
          {eventName ? <p className="max-w-[40%] shrink-0 truncate text-xs text-ink-mute">{eventName}</p> : null}
        </div>
        {children}
      </div>
    </header>
  );
}
