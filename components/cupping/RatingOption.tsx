import { cn } from "@/lib/utils";

export function RatingOption({
  score,
  label,
  name,
  checked,
  onChange,
}: {
  score: number;
  label: string;
  name: string;
  checked: boolean;
  onChange: (score: number) => void;
}) {
  const id = `${name}-${score}`;
  return (
    <label htmlFor={id} className="relative block cursor-pointer select-none">
      <input id={id} className="peer sr-only" type="radio" name={name} value={score} checked={checked} onChange={() => onChange(score)} />
      <span
        className={cn(
          "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg border px-0.5 py-1 text-center transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:scale-[0.97] peer-focus-visible:ring-4 peer-focus-visible:ring-ink/10 sm:min-h-12 sm:py-1.5",
          checked
            ? "border-leaf bg-leaf text-white shadow-raised"
            : "border-line bg-foam text-ink shadow-card hover:border-ink-mute hover:bg-paper",
        )}
      >
        <span className="font-display text-lg leading-none tabular">{score}</span>
        <span className={cn("text-[9px] leading-tight font-medium", checked ? "text-white/80" : "text-ink-soft")}>{label}</span>
      </span>
    </label>
  );
}
