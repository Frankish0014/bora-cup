import { COMMENT_MAX_LENGTH } from "@/lib/cupping";

export function CommentsField({
  id,
  label,
  hint,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-lg font-semibold tracking-tight text-ink">
          {label}
        </label>
        <span className="text-xs text-ink-mute">Required</span>
      </div>
      <p className="mt-1 text-sm text-ink-soft">{hint}</p>
      <textarea
        id={id}
        value={value}
        required
        aria-required="true"
        maxLength={COMMENT_MAX_LENGTH}
        rows={3}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-4 min-h-24 w-full rounded-xl border border-line-strong bg-foam px-3.5 py-3 text-base leading-7 text-ink shadow-[inset_0_1px_2px_rgb(20_19_15/0.03)] outline-none transition-[border-color,box-shadow] placeholder:text-ink-mute hover:border-ink-mute focus:border-ink focus:ring-4 focus:ring-ink/8"
      />
      <p className="mt-2 text-right text-xs text-ink-mute tabular">
        {value.length}/{COMMENT_MAX_LENGTH}
      </p>
    </div>
  );
}
