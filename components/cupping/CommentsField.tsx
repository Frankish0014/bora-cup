import { COMMENT_MAX_LENGTH } from "@/lib/cupping";

export function CommentsField({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-xs font-medium tracking-wide text-ink-soft">
          {label}
        </label>
        <span className="text-[10px] text-ink-mute tabular">
          Optional · {value.length}/{COMMENT_MAX_LENGTH}
        </span>
      </div>
      <textarea
        id={id}
        value={value}
        maxLength={COMMENT_MAX_LENGTH}
        rows={1}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="cupping-note mt-1 min-h-9 w-full resize-none rounded-lg border border-line bg-foam px-3 py-1.5 text-ink outline-none transition-[border-color,box-shadow] hover:border-ink-mute focus:border-ink focus:ring-4 focus:ring-ink/8 sm:mt-1.5 sm:min-h-11 sm:py-2"
      />
    </div>
  );
}
