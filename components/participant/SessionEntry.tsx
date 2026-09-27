"use client";

import { ParticipantForm } from "@/components/participant/ParticipantForm";
import { Brand } from "@/components/ui/brand";
import { Button, buttonClasses, buttonSm } from "@/components/ui/button";
import { Alert } from "@/components/ui/field";
import Link from "next/link";
import { useState } from "react";

export function SessionEntry({
  slug,
  sessionName,
  category,
  description,
  coffeeCount,
  notice,
}: {
  slug: string;
  sessionName: string;
  category: string;
  description: string | null;
  coffeeCount: number;
  notice?: string;
}) {
  const [started, setStarted] = useState(notice === "start");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-6 sm:py-10">
      <header className="flex items-center justify-between gap-4">
        <Brand compact />
        <Link href="/" className={buttonClasses("ghost", buttonSm)}>
          All sessions
        </Link>
      </header>

      <section className="mt-14 sm:mt-16">
        <p className="eyebrow">{category}</p>
        <h1 className="mt-3 text-[40px] leading-[1.05] text-ink sm:text-5xl">{sessionName}</h1>
        {description ? <p className="mt-4 max-w-md text-[17px] leading-7 text-ink-soft">{description}</p> : null}
        <p className="mt-4 max-w-md text-sm leading-6 text-ink-mute">Part of Best of Rwanda, the national coffee competition organized by NAEB with support from CEPAR.</p>
      </section>

      {started ? (
        <section className="card mt-10 animate-rise p-5 sm:p-7" aria-labelledby="about-you">
          {notice === "start" ? (
            <div className="mb-5">
              <Alert tone="info">Enter your details to begin cupping.</Alert>
            </div>
          ) : null}
          <h2 id="about-you" className="text-lg font-semibold tracking-tight text-ink">
            About you
          </h2>
          <p className="mt-1 text-sm leading-6 text-ink-soft">Your details are only used to record your feedback. They are never shown publicly.</p>
          <div className="mt-6">
            <ParticipantForm slug={slug} />
          </div>
        </section>
      ) : (
        <section className="mt-10 animate-rise">
          <div className="card p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-ink">How it works</h2>
            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-5 min-[420px]:grid-cols-2">
              <Fact term="Coffees" detail={`${coffeeCount}, one at a time`} />
              <Fact term="Notes" detail="Aroma, flavor, overall" />
              <Fact term="Scale" detail="1 OK to 5 Take My Money, once" />
              <Fact term="Comments" detail="Required" />
            </dl>
            <p className="mt-5 border-t border-line pt-4 text-sm leading-6 text-ink-soft">Your scores save automatically after each coffee. You can go back and adjust any coffee before submitting.</p>
          </div>
          <Button className="mt-5 w-full min-h-14 text-base" onClick={() => setStarted(true)}>
            Start cupping
          </Button>
        </section>
      )}
    </main>
  );
}

function Fact({ term, detail }: { term: string; detail: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-ink-mute">{term}</dt>
      <dd className="mt-1 text-[15px] leading-6 text-ink">{detail}</dd>
    </div>
  );
}
