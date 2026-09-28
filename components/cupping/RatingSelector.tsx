import { RatingOption } from "@/components/cupping/RatingOption";
import { RATING_OPTIONS } from "@/lib/ratings";

const QUESTIONS = {
  Aroma: "How would you rate the aroma?",
  Flavor: "How would you rate the flavor?",
  Overall: "How would you rate this coffee overall?",
  Rating: "How would you rate this coffee?",
};

export function RatingSelector({
  label,
  value,
  onChange,
  group,
}: {
  label: "Aroma" | "Flavor" | "Overall" | "Rating";
  value: number | null;
  onChange: (score: number) => void;
  group?: string;
}) {
  const name = group ?? label.toLowerCase();
  const selected = RATING_OPTIONS.find((option) => option.score === value);
  return (
    <fieldset>
      <legend className="sr-only">{QUESTIONS[label]}</legend>
      <div className="flex items-center justify-between gap-3">
        <p id={`${name}-question`} className="text-sm font-semibold text-ink">
          {label}
        </p>
        <p aria-live="polite" className="shrink-0">
          {selected ? (
            <span className="inline-flex items-center rounded-full bg-leaf px-2 py-0.5 text-[11px] font-medium text-white">{selected.label}</span>
          ) : (
            <span className="text-[11px] text-ink-mute">Required</span>
          )}
        </p>
      </div>
      <div className="mt-1.5 grid grid-cols-5 gap-1.5" role="radiogroup" aria-labelledby={`${name}-question`}>
        {RATING_OPTIONS.map((option) => (
          <RatingOption key={option.score} score={option.score} label={option.label} name={name} checked={value === option.score} onChange={onChange} />
        ))}
      </div>
    </fieldset>
  );
}
