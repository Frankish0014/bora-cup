"use client";

import { SignOutButton } from "@/components/admin/SignOutButton";
import { Brand } from "@/components/ui/brand";
import { buttonClasses, buttonSm } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

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
  const scrollerRef = useRef<HTMLElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateOverflow = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanLeft(scrollLeft > 8);
    setCanRight(scrollLeft + clientWidth < scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const active = el.querySelector<HTMLElement>("[aria-current=page]");
    active?.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "auto" });
    updateOverflow();
    const onScroll = () => updateOverflow();
    el.addEventListener("scroll", onScroll, { passive: true });
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(el);
    window.addEventListener("resize", updateOverflow);
    return () => {
      el.removeEventListener("scroll", onScroll);
      observer.disconnect();
      window.removeEventListener("resize", updateOverflow);
    };
  }, [pathname, updateOverflow]);

  const slide = (direction: -1 | 1) => {
    scrollerRef.current?.scrollBy({ left: direction * Math.min(220, (scrollerRef.current.clientWidth || 220) * 0.7), behavior: "smooth" });
  };

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
        <div className="relative min-w-0 lg:flex-1">
          <nav
            ref={scrollerRef}
            className="admin-nav-scroll flex min-w-0 gap-1 overflow-x-auto rounded-2xl bg-paper p-1 lg:rounded-full"
            aria-label="Admin"
          >
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
          {canLeft ? (
            <>
              <div className="pointer-events-none absolute inset-y-0 left-0 w-12 rounded-l-2xl bg-gradient-to-r from-paper to-transparent lg:rounded-l-full" />
              <button
                type="button"
                onClick={() => slide(-1)}
                className="absolute top-1/2 left-0.5 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-line bg-foam text-ink shadow-card"
                aria-label="Show previous menus"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2.4} />
              </button>
            </>
          ) : null}
          {canRight ? (
            <>
              <div className="pointer-events-none absolute inset-y-0 right-0 w-12 rounded-r-2xl bg-gradient-to-l from-paper to-transparent lg:rounded-r-full" />
              <button
                type="button"
                onClick={() => slide(1)}
                className="absolute top-1/2 right-0.5 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-line bg-foam text-ink shadow-card"
                aria-label="Show more menus"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
              </button>
            </>
          ) : null}
        </div>
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
