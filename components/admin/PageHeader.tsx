import { buttonClasses, buttonSm } from "@/components/ui/button";
import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  eyebrow,
  description,
  action,
}: {
  title: string;
  eyebrow?: ReactNode;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8">
      {eyebrow ? <div className="mb-4">{eyebrow}</div> : null}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl leading-[1.1] text-ink sm:text-4xl">{title}</h1>
          {description ? <p className="mt-2 max-w-2xl text-[15px] leading-6 text-ink-soft">{description}</p> : null}
        </div>
        {action ? <div className="flex flex-wrap items-center gap-2 pt-1">{action}</div> : null}
      </div>
    </div>
  );
}

export function SectionTitle({ children, action, description }: { children: ReactNode; action?: ReactNode; description?: string }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[17px] font-semibold tracking-tight text-ink">{children}</h2>
        {description ? <p className="mt-0.5 text-sm text-ink-soft">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={buttonClasses("ghost", `${buttonSm} -ml-3.5`)}>
      Back to {children}
    </Link>
  );
}

/** Small action link styled as a secondary button, for section headers. */
export function SectionAction({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={buttonClasses("secondary", buttonSm)}>
      {children}
    </Link>
  );
}
