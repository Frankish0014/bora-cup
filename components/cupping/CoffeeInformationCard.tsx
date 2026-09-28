import { visibleCoffeeFields, type CoffeeFields } from "@/lib/coffee";

const SUMMARY_KEYS = ["process", "variety", "altitude", "washing_station", "district", "lot_number"] as const;

export function CoffeeInformationCard({ lot, position }: { lot: CoffeeFields & { lot_name: string }; position?: number }) {
  const fields = visibleCoffeeFields(lot).filter((field) => field.key !== "cupping_code");
  const summary = SUMMARY_KEYS.flatMap((key) => fields.find((field) => field.key === key) ?? []).slice(0, 4);
  const notes = fields.find((field) => field.key === "description");
  const photo = lot.photo_url?.trim();

  return (
    <div className="flex items-stretch bg-leaf text-white">
      <div className="min-w-0 flex-1 px-4 py-3.5">
        {position ? <p className="text-[11px] font-medium text-white/70 tabular">Coffee {position}</p> : null}
        <h2 id={position ? `coffee-title-${position}` : "coffee-title"} tabIndex={-1} className="mt-0.5 text-lg leading-tight text-balance text-white outline-none sm:text-xl">
          {lot.lot_name}
        </h2>
        {summary.length > 0 ? <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-pretty text-white/80">{summary.map((field) => field.value).join(" · ")}</p> : null}
        {notes ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-pretty text-white/65">{notes.value}</p> : null}
      </div>
      {photo ? (
        <div className="relative w-28 shrink-0 sm:w-40">
          <img src={photo} alt="" className="photo-fade absolute inset-0 h-full w-full object-cover" />
        </div>
      ) : null}
    </div>
  );
}
