"use client";

import { SignOutButton } from "@/components/admin/SignOutButton";
import { Brand } from "@/components/ui/brand";
import { buttonClasses, buttonSm } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const GROUPS = [
  { label: "Overview", links: [{ href: "/admin/dashboard", label: "Dashboard" }] },
  {
    label: "Setup",
    links: [
      { href: "/admin/events", label: "Events" },
      { href: "/admin/sessions", label: "Sessions" },
      { href: "/admin/coffees", label: "Coffee lots" },
      { href: "/admin/qr-codes", label: "QR codes" },
    ],
  },
  {
    label: "Feedback",
    links: [
      { href: "/admin/participants", label: "Participants" },
      { href: "/admin/evaluations", label: "Evaluations" },
      { href: "/admin/analytics", label: "Analytics" },
    ],
  },
  { label: "System", links: [{ href: "/admin/settings", label: "Settings" }] },
];

const ALL_LINKS = GROUPS.flatMap((group) => group.links);

export function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(`${href}/`));
}

export function currentSection(pathname: string) {
  return ALL_LINKS.find((link) => isActive(pathname, link.href))?.label ?? "Admin";
}

export function AdminNav({ email }: { email: string | null }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 px-3 pt-3 sm:px-5">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 rounded-[1.35rem] border border-line bg-foam px-3 py-3 shadow-card lg:flex-row lg:items-center lg:px-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/admin/dashboard" className="inline-flex rounded-full">
            <Brand compact />
          </Link>
          <div className="flex items-center gap-1 lg:hidden">
            <Link href="/" target="_blank" className={buttonClasses("secondary", buttonSm)}>
              View site
            </Link>
            <SignOutButton />
          </div>
        </div>
        <nav className="flex min-w-0 gap-1 overflow-x-auto rounded-full bg-paper p-1 [scrollbar-width:none] lg:flex-1" aria-label="Admin">
          {ALL_LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-sm whitespace-nowrap transition-colors",
                  active ? "bg-foam font-semibold text-ink shadow-card" : "text-ink-soft hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {email ? <span className="max-w-[12rem] truncate text-xs text-ink-mute">{email}</span> : null}
          <Link href="/" target="_blank" className={buttonClasses("secondary", buttonSm)}>
            View site
          </Link>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
