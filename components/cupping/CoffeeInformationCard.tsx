import { visibleCoffeeFields, type CoffeeFields } from "@/lib/coffee";

export function CoffeeInformationCard({ lot, position }: { lot: CoffeeFields & { lot_name: string }; position?: number }) {
  const fields = visibleCoffeeFields(lot);
  const notes = fields.find((field) => field.key === "description");
  const facts = fields.filter((field) => field.key !== "description");

  return (
    <section aria-labelledby="coffee-title" className="card overflow-hidden">
      <div className="bg-leaf px-5 py-5 text-white sm:px-6">
        {position ? <p className="text-xs font-medium text-white/75 tabular">Coffee No. {position}</p> : null}
        <h2 id="coffee-title" tabIndex={-1} className="mt-1 text-3xl leading-[1.1] text-white outline-none sm:text-4xl">
          {lot.lot_name}
        </h2>
      </div>
      {facts.length > 0 ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 sm:p-6">
          {facts.map((field) => (
            <div key={field.key} className="min-w-0">
              <dt className="text-xs font-medium text-ink-mute">{field.label}</dt>
              <dd className="mt-1 text-[15px] leading-6 font-medium text-ink whitespace-pre-wrap break-words">{field.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {notes ? (
        <div className={facts.length > 0 ? "border-t border-line bg-paper/70 px-5 py-4 sm:px-6" : "px-5 py-4 sm:px-6"}>
          <p className="text-xs font-medium text-ink-mute">Notes</p>
          <p className="mt-1 text-[15px] leading-7 text-ink-soft whitespace-pre-wrap">{notes.value}</p>
        </div>
      ) : null}
    </section>
  );
}
