import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary: "bg-leaf text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18)] hover:bg-leaf-deep",
  accent: "bg-leaf text-white hover:bg-leaf-deep",
  secondary: "border border-line bg-foam text-ink shadow-card hover:bg-paper",
  ghost: "text-ink-soft hover:bg-paper-2 hover:text-ink",
  danger: "border border-danger/25 bg-foam text-danger shadow-card hover:bg-danger-bg",
  light: "bg-foam text-ink shadow-card hover:bg-paper-2",
};

export type ButtonVariant = keyof typeof variants;

export function buttonClasses(variant: ButtonVariant = "primary", className?: string) {
  return cn(
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    className,
  );
}

/** Compact size for toolbars, table rows and page headers. */
export const buttonSm = "min-h-10 px-4 text-sm";
/** Extra compact for inline row actions. */
export const buttonXs = "min-h-8 px-3 text-[13px]";

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button type={type} className={buttonClasses(variant, className)} {...props} />;
}
