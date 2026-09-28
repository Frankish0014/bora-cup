import { visibleCoffeeFields, type CoffeeFields } from "@/lib/coffee";

const SUMMARY_KEYS = ["process", "variety", "altitude", "washing_station", "district", "lot_number"] as const;

export function CoffeeInformationCard({ lot, position }: { lot: CoffeeFields & { lot_name: string }; position?: number }) {
  const fields = visibleCoffeeFields(lot).filter((field) => field.key !== "cupping_code");
  const summary = SUMMARY_KEYS.flatMap((key) => fields.find((field) => field.key === key) ?? []).slice(0, 4);
  const notes = fields.find((field) => field.key === "description");

  return (
    <div className="bg-leaf px-4 py-3 text-white">
      <div className="flex items-baseline justify-between gap-3">
        {position ? <p className="text-[11px] font-medium text-white/75 tabular">Coffee {position}</p> : <span />}
      </div>
      <h2 id={position ? `coffee-title-${position}` : "coffee-title"} tabIndex={-1} className="text-xl leading-tight text-white outline-none">
        {lot.lot_name}
      </h2>
      {summary.length > 0 ? <p className="mt-1 truncate text-xs text-white/80">{summary.map((field) => field.value).join(" · ")}</p> : null}
      {notes ? <p className="mt-1 line-clamp-1 text-xs text-white/70">{notes.value}</p> : null}
    </div>
  );
}
