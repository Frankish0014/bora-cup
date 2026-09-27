import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-ink">{label}</span>
        {hint ? <span className="text-xs text-ink-mute">{hint}</span> : null}
      </span>
      {children}
      {error ? (
        <span className="mt-2 block text-sm text-danger" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export const controlClasses =
  "min-h-12 w-full rounded-xl border border-line-strong bg-foam px-3.5 text-base text-ink shadow-[inset_0_1px_2px_rgb(20_19_15/0.03)] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-ink-mute hover:border-ink-mute focus:border-ink focus:ring-4 focus:ring-ink/8 aria-invalid:border-danger aria-invalid:focus:ring-danger/10";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClasses, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlClasses, "min-h-32 py-3 leading-7", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block">
      <select className={cn(controlClasses, "appearance-none pr-10", className)} {...props}>
        {children}
      </select>
      <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-ink-mute" />
    </span>
  );
}

export function Checkbox({
  label,
  description,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; description?: string }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-paper/60 p-4 transition-colors hover:bg-paper", className)}>
      <input type="checkbox" className="mt-0.5 h-4.5 w-4.5 shrink-0 rounded accent-ink" {...props} />
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description ? <span className="mt-0.5 block text-sm text-ink-soft">{description}</span> : null}
      </span>
    </label>
  );
}

export function Alert({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "info" | "success" }) {
  const tones = {
    error: "border-danger/20 bg-danger-bg text-danger",
    info: "border-line bg-paper-2/70 text-ink-soft",
    success: "border-leaf/20 bg-leaf-soft text-leaf-deep",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-xl border px-4 py-3 text-sm leading-6", tones[tone])}>
      {children}
    </div>
  );
}
