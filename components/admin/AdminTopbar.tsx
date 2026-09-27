"use client";

import { currentSection } from "@/components/admin/AdminNav";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { buttonClasses, buttonSm } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminTopbar({ email }: { email: string | null }) {
  const pathname = usePathname();
  return (
    <div className="sticky top-0 z-20 flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line bg-paper/90 px-4 py-2 backdrop-blur-md sm:px-5 md:px-8">
      <p className="text-sm font-medium text-ink">{currentSection(pathname)}</p>
      <div className="flex min-w-0 items-center gap-2">
        {email ? <span className="mr-1 hidden max-w-[14rem] truncate text-xs text-ink-mute xl:inline">{email}</span> : null}
        <Link href="/" target="_blank" className={buttonClasses("secondary", buttonSm)}>
          View site
        </Link>
        <SignOutButton />
      </div>
    </div>
  );
}
