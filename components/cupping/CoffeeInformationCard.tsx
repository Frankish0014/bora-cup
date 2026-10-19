import { visibleCoffeeFields, type CoffeeFields } from "@/lib/coffee";
import { type FormTypeId } from "@/lib/forms";
import { formatScoreBand, ratingScale } from "@/lib/ratings";

const FACT_KEYS = ["process", "variety", "altitude", "harvest", "washing_station", "province", "district", "sector", "cell", "country", "producer", "cooperative", "lot_number"] as const;

export function CoffeeInformationCard({
  lot,
  position,
  rating,
  total,
  formType,
}: {
  lot: CoffeeFields & { lot_name: string };
  position?: number;
  rating?: number | null;
  total?: number | null;
  formType?: FormTypeId;
}) {
  const fields = visibleCoffeeFields(lot).filter((field) => field.key !== "cupping_code");
  const facts = FACT_KEYS.flatMap((key) => fields.find((field) => field.key === key) ?? []);
  const notes = fields.find((field) => field.key === "description");
  const photo = lot.photo_url?.trim();
  const band =
    formType && formType !== "bora" && total != null
      ? total % 1 === 0
        ? String(total)
        : total.toFixed(1)
      : formatScoreBand(rating, total);
  const caption = total && total >= 80 ? ratingScale(rating) : "";

  return (
    <div className={photo ? "grid grid-cols-[minmax(0,1.05fr)_minmax(7.5rem,0.9fr)] items-stretch bg-leaf text-white sm:grid-cols-[minmax(0,1.15fr)_minmax(13rem,1fr)]" : "flex items-stretch bg-leaf text-white"}>
      <div className="min-w-0 px-3 py-3 sm:px-4 sm:py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {position ? <p className="text-[10px] font-medium tracking-wide text-white/65 tabular">Cup {position}</p> : null}
            <h2 id={position ? `coffee-title-${position}` : "coffee-title"} tabIndex={-1} className="mt-0.5 text-[15px] font-semibold leading-snug tracking-tight break-words text-white outline-none sm:text-lg">
              {lot.lot_name}
            </h2>
          </div>
          {band ? (
            <p className="shrink-0 text-right">
              <span className="block font-display text-lg leading-none tabular text-white">{band}</span>
              {caption ? <span className="mt-0.5 block text-[10px] font-medium text-white/70">{caption}</span> : null}
            </p>
          ) : null}
        </div>
        {facts.length > 0 ? (
          <p className="mt-1 break-words text-[11px] leading-4 text-pretty text-white/75">{facts.map((field) => field.value).join(" · ")}</p>
        ) : null}
        {notes ? <p className="mt-1 break-words text-[11px] leading-4 text-pretty text-white/60">{notes.value}</p> : null}
      </div>
      {photo ? (
        <div className="relative min-h-[6.5rem]">
          <img src={photo} alt="" className="photo-fade absolute inset-0 h-full w-full object-cover object-center" />
        </div>
      ) : null}
    </div>
  );
}
