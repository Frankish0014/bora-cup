import { buttonClasses, buttonSm } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import Link from "next/link";
import type { ReactNode } from "react";

export function FilterBar({ children, resetHref, columns = 3 }: { children: ReactNode; resetHref: string; columns?: 3 | 4 }) {
  return (
    <form method="get" className="card p-5">
      <div className={columns === 4 ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-4" : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"}>{children}</div>
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <button className={buttonClasses("primary", buttonSm)} type="submit">
          Apply filters
        </button>
        <Link href={resetHref} className={buttonClasses("ghost", buttonSm)}>
          Reset
        </Link>
      </div>
    </form>
  );
}

export function FilterSelect({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink-soft">{label}</span>
      <Select name={name} defaultValue={defaultValue ?? ""} className="min-h-11">
        <option value="">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </label>
  );
}

export function FilterInput({ name, label, type = "text", defaultValue, placeholder }: { name: string; label: string; type?: string; defaultValue?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink-soft">{label}</span>
      <Input type={type} name={name} defaultValue={defaultValue ?? ""} placeholder={placeholder} className="min-h-11" />
    </label>
  );
}
