"use client";

import { FormPicker } from "@/components/cupping/FormPicker";
import { ParticipantForm } from "@/components/participant/ParticipantForm";
import { Brand } from "@/components/ui/brand";
import { Button, buttonClasses, buttonSm } from "@/components/ui/button";
import { Alert } from "@/components/ui/field";
import { formMeta, type FormPolicy, type FormTypeId } from "@/lib/forms";
import Link from "next/link";
import { useState } from "react";

export function SessionEntry({
  slug,
  sessionName,
  category,
  description,
  eventName,
  eventDescription,
  formPolicy,
  formType,
  coffeeCount,
  notice,
  emailEnabled,
  joiningClosed,
}: {
  slug: string;
  sessionName: string;
  category: string;
  description: string | null;
  eventName: string;
  eventDescription: string | null;
  formPolicy: FormPolicy;
  formType: FormTypeId | string;
  coffeeCount: number;
  notice?: string;
  emailEnabled?: boolean;
  joiningClosed?: boolean;
}) {
  const lockedForm = formMeta(formType);
  const [started, setStarted] = useState(notice === "start" || Boolean(joiningClosed));
  const [chosenForm, setChosenForm] = useState<FormTypeId>(lockedForm.id);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-6 sm:py-10">
      <header className="flex items-center justify-between gap-4">
        <Brand compact name={eventName} />
        <Link href="/" className={buttonClasses("ghost", buttonSm)}>
          All sessions
        </Link>
      </header>

      <section className="mt-14 sm:mt-16">
        <p className="eyebrow">{eventName}</p>
        <h1 className="mt-3 text-[40px] leading-[1.05] text-ink sm:text-5xl">{sessionName}</h1>
        <p className="mt-2 text-sm text-ink-mute">{category}</p>
        {eventDescription ? <p className="mt-4 max-w-md text-[17px] leading-7 text-ink-soft">{eventDescription}</p> : null}
        {description ? <p className="mt-3 max-w-md text-[15px] leading-7 text-ink-soft">{description}</p> : null}
      </section>

      {started ? (
        <section className="card mt-10 animate-rise p-5 sm:p-7" aria-labelledby="about-you">
          {joiningClosed ? (
            <div className="mb-5">
              <Alert tone="info">This table is closed to new cuppers. If you already started here, enter the same email to continue.</Alert>
            </div>
          ) : notice === "start" ? (
            <div className="mb-5">
              <Alert tone="info">Enter your details to begin cupping. If you already cupped this session, you will see your previous scores.</Alert>
            </div>
          ) : null}
          <h2 id="about-you" className="text-lg font-semibold tracking-tight text-ink">
            About you
          </h2>
          <p className="mt-1 text-sm leading-6 text-ink-soft">
            Your details are only used to record your feedback. They are never shown on the public review page.
            {emailEnabled ? " We will send a short welcome to this email, and a thank-you after you submit." : ""}
          </p>
          {formPolicy === "choice" ? (
            <div className="mt-6">
              <FormPicker value={chosenForm} onChange={setChosenForm} />
            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-paper px-3 py-2 text-sm text-ink-soft">This table uses the {lockedForm.name}.</p>
          )}
          <div className="mt-6">
            <ParticipantForm slug={slug} formType={formPolicy === "choice" ? chosenForm : lockedForm.id} />
          </div>
        </section>
      ) : (
        <section className="mt-10 animate-rise">
          <div className="card p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-ink">How it works</h2>
            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-5 min-[420px]:grid-cols-2">
              <Fact term="Cups" detail={`${coffeeCount} left to right`} />
              <Fact term="Form" detail={formPolicy === "choice" ? "You choose the scoresheet" : lockedForm.short} />
              <Fact term="Save" detail="Each rating is stored as you go" />
              <Fact term="Return" detail="Re-enter with the same email to edit" />
            </dl>
            <p className="mt-5 border-t border-line pt-4 text-sm leading-6 text-ink-soft">
              Cup 1 is the first coffee on the table, on your left. Scroll through every lot in that order, then save. You can come back later with the same email to change a note or rating and submit again.
            </p>
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
