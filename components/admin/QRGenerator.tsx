"use client";

import { StatusBadge } from "@/components/ui/badge";
import { Button, buttonClasses, buttonSm } from "@/components/ui/button";
import { useState } from "react";

export function QRGenerator({ name, slug, url, active }: { name: string; slug: string; url: string; active: boolean }) {
  const [copied, setCopied] = useState(false);
  const image = `/api/qr/${slug}`;

  return (
    <article className="card grid gap-6 p-5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:p-6">
      <div className="rounded-xl border border-line bg-white p-2">
        {/* The QR image is generated for this signed-in admin and is not a static file. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={`QR code for ${name}`} width={280} height={280} className="h-auto w-full" />
      </div>
      <div className="flex min-w-0 flex-col">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[17px] font-semibold tracking-tight text-ink">{name}</h2>
          <StatusBadge active={active} />
        </div>
        <p className="mt-2 break-all rounded-lg bg-paper px-3 py-2 font-mono text-xs text-ink-soft">{url}</p>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
          <a className={buttonClasses("primary", buttonSm)} href={`${image}?download=1`}>
            Download PNG
          </a>
          <a className={buttonClasses("secondary", buttonSm)} href={image} target="_blank" rel="noreferrer">
            Open image
          </a>
          <Button
            variant="secondary"
            className={buttonSm}
            onClick={async () => {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
      </div>
    </article>
  );
}
