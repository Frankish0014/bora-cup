import { Brand } from "@/components/ui/brand";
import type { ReactNode } from "react";

export function StatusScreen({
  eyebrow,
  title,
  message,
  children,
}: {
  eyebrow?: string;
  title: string;
  message?: string;
  children?: ReactNode;
  tone?: "neutral" | "success";
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-6 sm:py-10">
      <header>
        <Brand compact />
      </header>
      <div className="card my-auto animate-rise p-7 sm:p-10">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="mt-2 font-display text-[36px] leading-[1.08] text-ink sm:text-5xl">{title}</h1>
        {message ? <p className="mt-4 max-w-md text-[17px] leading-7 text-ink-soft">{message}</p> : null}
        {children ? <div className="mt-8 flex flex-wrap gap-3">{children}</div> : null}
      </div>
    </main>
  );
}
