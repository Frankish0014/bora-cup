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
    <fieldset className="card p-5 sm:p-6">
      <legend className="sr-only">{QUESTIONS[label]}</legend>
      <div className="flex items-center justify-between gap-3">
        <p className="text-lg font-semibold tracking-tight text-ink">{label}</p>
        <p aria-live="polite" className="shrink-0">
          {selected ? (
            <span className="inline-flex items-center rounded-full bg-leaf px-2.5 py-1 text-xs font-medium text-white">{selected.label}</span>
          ) : (
            <span className="text-xs text-ink-mute">Required</span>
          )}
        </p>
      </div>
      <p id={`${name}-question`} className="mt-1 text-sm text-ink-soft">
        {QUESTIONS[label]}
      </p>
      <div className="mt-4 grid grid-cols-5 gap-1.5 sm:gap-2" role="radiogroup" aria-labelledby={`${name}-question`}>
        {RATING_OPTIONS.map((option) => (
          <RatingOption key={option.score} score={option.score} label={option.label} name={name} checked={value === option.score} onChange={onChange} />
        ))}
      </div>
    </fieldset>
  );
}
