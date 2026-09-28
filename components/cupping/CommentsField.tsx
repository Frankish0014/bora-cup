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
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        <span className="text-[11px] text-ink-mute tabular">
          {value.length}/{COMMENT_MAX_LENGTH}
        </span>
      </div>
      <textarea
        id={id}
        value={value}
        required
        aria-required="true"
        maxLength={COMMENT_MAX_LENGTH}
        rows={2}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 min-h-11 w-full resize-none rounded-lg border border-line-strong bg-foam px-3 py-2 text-sm leading-5 text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-mute hover:border-ink-mute focus:border-ink focus:ring-4 focus:ring-ink/8"
      />
    </div>
  );
}
