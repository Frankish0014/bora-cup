"use client";

import { leaveCupping } from "@/lib/actions/participant";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LeaveTableButton({
  slug,
  participantSessionId,
  hasRatings,
}: {
  slug: string;
  participantSessionId: string;
  hasRatings: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function leave() {
    const ok = hasRatings
      ? window.confirm("Leave this table? Your notes stay saved. They will not count in averages until you submit.")
      : window.confirm("Leave this table? Nothing has been submitted. You can join again later.");
    if (!ok) return;
    setPending(true);
    const result = await leaveCupping(participantSessionId);
    setPending(false);
    if (!result.ok) {
      window.alert(result.message || "Something went wrong while leaving this table.");
      return;
    }
    router.push(`/session/${slug}`);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void leave()}
      disabled={pending}
      className="shrink-0 text-[11px] font-medium text-ink-mute hover:text-ink disabled:opacity-50"
    >
      {pending ? "Leaving…" : "Leave table"}
    </button>
  );
}
