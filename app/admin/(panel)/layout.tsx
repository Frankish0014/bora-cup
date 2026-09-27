import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/auth";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="min-h-dvh">
      <AdminNav email={user.email ?? null} />
      <div className="mx-auto w-full max-w-6xl px-3 pt-5 pb-16 sm:px-5 sm:pt-6">{children}</div>
    </div>
  );
}
