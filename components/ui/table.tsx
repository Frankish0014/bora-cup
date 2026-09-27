import { cn } from "@/lib/utils";
import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

export function TableShell({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("card overflow-hidden", className)} {...props}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full text-left text-sm", className)} {...props} />;
}

export function TH({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th scope="col" className={cn("border-b border-line bg-paper/70 px-4 py-2.5 text-xs font-medium text-ink-mute", className)} {...props} />;
}

export function TR({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("border-b border-line transition-colors last:border-b-0 hover:bg-paper/60", className)} {...props} />;
}

export function TD({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3.5 align-middle text-ink", className)} {...props} />;
}

export function EmptyRow({ children }: { children: string }) {
  return <p className="px-4 py-12 text-center text-sm text-ink-soft">{children}</p>;
}
