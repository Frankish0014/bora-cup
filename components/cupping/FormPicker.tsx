"use client";

import { FORM_TYPES, type FormTypeId } from "@/lib/forms";
import { cn } from "@/lib/utils";

export function FormPicker({
  value,
  onChange,
}: {
  value: FormTypeId;
  onChange: (value: FormTypeId) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-ink">Cupping form</legend>
      <p className="text-sm leading-6 text-ink-soft">Choose the scoresheet for this table. You will keep the same form if you come back to edit.</p>
      <div className="space-y-2">
        {FORM_TYPES.map((form) => (
          <label
            key={form.id}
            className={cn(
              "flex cursor-pointer gap-3 rounded-2xl border px-4 py-3",
              value === form.id ? "border-leaf bg-leaf-soft" : "border-line bg-foam",
            )}
          >
            <input type="radio" className="mt-1" name="formType" checked={value === form.id} onChange={() => onChange(form.id)} />
            <span>
              <span className="block text-sm font-medium text-ink">{form.name}</span>
              <span className="mt-0.5 block text-xs leading-5 text-ink-soft">{form.summary}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
