"use client";

import { controlClasses } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { forwardRef, useState, type InputHTMLAttributes } from "react";

export const PasswordInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function PasswordInput(
  { className, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative block">
      <input
        ref={ref}
        {...props}
        type={visible ? "text" : "password"}
        className={cn(controlClasses, "pr-[4.25rem]", className)}
      />
      <button
        type="button"
        className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink-soft hover:bg-paper-2 hover:text-ink"
        aria-pressed={visible}
        aria-label={visible ? "Hide password" : "View password"}
        onClick={() => setVisible((open) => !open)}
      >
        {visible ? "Hide" : "View"}
      </button>
    </span>
  );
});
