import { Brand } from "@/components/ui/brand";
import { buttonClasses } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";

export function SubmissionConfirmation() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-6 sm:py-10">
      <header>
        <Brand compact />
      </header>
      <div className="card my-auto animate-rise p-7 text-center sm:p-10">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-leaf-soft text-leaf" aria-hidden="true">
          <Check size={26} strokeWidth={2.5} />
        </span>
        <h1 className="mt-6 font-display text-[40px] leading-[1.05] text-ink sm:text-5xl">Thank you.</h1>
        <p className="mt-4 text-[17px] leading-7 text-ink">Your cupping feedback has been successfully submitted.</p>
        <p className="mt-2 text-[15px] leading-7 text-ink-soft">Thank you for participating in the Best of Rwanda Cup Tour.</p>
        <Link href="/" className={buttonClasses("primary", "mt-8 w-full min-h-13 text-base")}>
          Done
        </Link>
      </div>
    </main>
  );
}
