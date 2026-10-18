import { Brand } from "@/components/ui/brand";
import { buttonClasses, buttonSm } from "@/components/ui/button";
import { CopyLink } from "@/components/ui/CopyLink";
import { PrintButton } from "@/components/review/PrintButton";
import { padCup } from "@/lib/review";
import type { CoffeeLot } from "@/types/domain";
import Link from "next/link";

export function TableMap({
  eventName,
  sessionName,
  category,
  coffees,
  tableUrl,
  reviewHref,
  cuppingHref,
}: {
  eventName: string;
  sessionName: string;
  category: string;
  coffees: CoffeeLot[];
  tableUrl: string;
  reviewHref: string;
  cuppingHref: string;
}) {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-wrap items-center justify-between gap-3 no-print">
        <Brand compact name={eventName} />
        <div className="flex flex-wrap items-center gap-2">
          <PrintButton label="Print table map" />
          <CopyLink url={tableUrl} label="Copy setup link" />
          <Link href={reviewHref} className={buttonClasses("ghost", buttonSm)}>
            Review scores
          </Link>
        </div>
      </header>

      <section className="mt-10 sm:mt-14">
        <p className="eyebrow">Lab table setup</p>
        <h1 className="mt-2 font-display text-[40px] leading-[1.05] text-ink sm:text-5xl">{sessionName}</h1>
        <p className="mt-3 text-[15px] text-ink-soft">
          {eventName}
          {category ? ` · ${category}` : ""}
        </p>
        <p className="mt-6 max-w-2xl text-[17px] leading-7 text-ink">
          Place cups from the cupper’s left to right. Cup 1 is the first coffee on the digital sheet.
        </p>
      </section>

      <ol className="mt-8 grid gap-3 sm:grid-cols-2">
        <Step n="1" title="Line the cups" body="Set one cup per lot along the table, in a single row facing the cuppers." />
        <Step n="2" title="Start on the left" body="Cup 1 sits at the cupper’s left. Cup 2 is immediately to its right, then 3, 4, and so on." />
        <Step n="3" title="Match this list" body="The numbers below are the same order as the cupping page. Do not shuffle lots after the table is set." />
        <Step n="4" title="Open the sheet" body="The session QR opens coffees in this order. The first card is cup 1." />
      </ol>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink">Cup order</h2>
            <p className="mt-1 text-sm text-ink-soft">Left → right from the cupper’s seat.</p>
          </div>
          <p className="text-xs font-medium tabular text-ink-mute">{coffees.length} cup{coffees.length === 1 ? "" : "s"}</p>
        </div>

        {coffees.length === 0 ? (
          <p className="card mt-4 px-6 py-16 text-center text-sm text-ink-soft">No active lots in this session yet.</p>
        ) : (
          <ol className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {coffees.map((coffee, index) => {
              const facts = [coffee.process, coffee.variety, coffee.washing_station].filter(Boolean);
              return (
                <li key={coffee.id} className="card print-break flex min-h-[9.5rem] flex-col p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-leaf text-sm font-semibold text-white tabular">
                    {padCup(index + 1)}
                  </span>
                  <p className="mt-3 font-semibold leading-5 tracking-tight text-ink">{coffee.lot_name}</p>
                  {facts.length > 0 ? <p className="mt-1 text-xs leading-4 text-ink-soft">{facts.join(" · ")}</p> : null}
                  {coffee.cupping_code ? <p className="mt-auto pt-3 font-mono text-[11px] text-ink-mute">{coffee.cupping_code}</p> : <span className="mt-auto" />}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <p className="mt-10 rounded-2xl bg-leaf-soft px-4 py-3 text-sm leading-6 text-leaf-deep">
        If a second row is needed, finish the first row left to right, then start the next row again from the cupper’s left.
      </p>
      <p className="mt-6 text-xs text-ink-mute no-print">
        Cupping page: {cuppingHref.replace(/^https?:\/\//, "")}
      </p>
    </main>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="card print-break p-5">
      <p className="text-[11px] font-medium tabular text-ink-mute">Step {n}</p>
      <h3 className="mt-1 font-semibold tracking-tight text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-ink-soft">{body}</p>
    </li>
  );
}
