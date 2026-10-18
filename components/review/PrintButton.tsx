"use client";

import { Button, buttonSm } from "@/components/ui/button";

export function PrintButton({ label }: { label: string }) {
  return (
    <Button variant="secondary" className={`${buttonSm} no-print`} onClick={() => window.print()}>
      {label}
    </Button>
  );
}
