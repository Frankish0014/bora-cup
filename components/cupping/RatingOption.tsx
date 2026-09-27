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
          "flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border px-0.5 py-2 text-center transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:scale-[0.97] peer-focus-visible:ring-4 peer-focus-visible:ring-ink/10 sm:min-h-[4.75rem] sm:px-1 sm:py-2.5",
          checked
            ? "border-leaf bg-leaf text-white shadow-raised"
            : "border-line bg-foam text-ink shadow-card hover:border-ink-mute hover:bg-paper",
        )}
      >
        <span className="font-display text-xl leading-none tabular sm:text-[28px]">{score}</span>
        <span className={cn("text-[10px] leading-tight font-medium sm:text-[11px]", checked ? "text-white/80" : "text-ink-soft")}>{label}</span>
      </span>
    </label>
  );
}
