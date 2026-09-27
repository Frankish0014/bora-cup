import type { ReactNode } from "react";

export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="card grid gap-5 p-5 sm:p-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-ink-soft">{description}</p> : null}
      </div>
      <div className="max-w-xl space-y-4">{children}</div>
    </section>
  );
}

export function FormActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3 pt-1">{children}</div>;
}
