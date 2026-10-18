"use client";

import { Button, buttonSm } from "@/components/ui/button";
import { useState } from "react";

export function CopyLink({
  url,
  label = "Copy link",
  className,
}: {
  url: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      variant="secondary"
      className={className ?? buttonSm}
      onClick={async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }}
    >
      {copied ? "Copied" : label}
    </Button>
  );
}
