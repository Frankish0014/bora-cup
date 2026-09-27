"use client";

import { Button, buttonSm, buttonXs } from "@/components/ui/button";
import { deleteCoffee, deleteEvent, deleteSession, moveCoffee, setEventActive, setSessionActive } from "@/lib/actions/admin";
import type { ActionResult } from "@/lib/validations";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Kind = "event" | "session" | "coffee";

const toggles: Record<Exclude<Kind, "coffee">, (id: string, active: boolean) => Promise<ActionResult>> = {
  event: setEventActive,
  session: setSessionActive,
};

const deletions: Record<Kind, (id: string) => Promise<ActionResult<{ deactivated?: boolean } | undefined>>> = {
  event: deleteEvent,
  session: deleteSession,
  coffee: deleteCoffee,
};

export function ActiveToggle({ kind, id, active }: { kind: Exclude<Kind, "coffee">; id: string; active: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <Button
      variant="secondary"
      className={buttonSm}
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await toggles[kind](id, !active);
        router.refresh();
        setPending(false);
      }}
    >
      {pending ? "Saving…" : active ? "Deactivate" : "Activate"}
    </Button>
  );
}

export function DeleteButton({
  kind,
  id,
  label,
  confirmText,
  redirectTo,
}: {
  kind: Kind;
  id: string;
  label: string;
  confirmText: string;
  redirectTo?: string;
}) {
  const onDelete = () => deletions[kind](id);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="inline-flex flex-col items-start gap-2">
      {open ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-danger/20 bg-danger-bg px-3 py-2">
          <span className="text-sm text-danger">{confirmText}</span>
          <Button
            variant="primary"
            className={`${buttonXs} bg-danger hover:bg-danger active:bg-danger`}
            disabled={pending}
            onClick={async () => {
              setPending(true);
              const result = await onDelete();
              setPending(false);
              if (!result.ok) {
                setMessage(result.message);
                return;
              }
              if (result.data?.deactivated) {
                setMessage("It has evaluations, so it was deactivated instead of deleted.");
                setOpen(false);
                router.refresh();
                return;
              }
              if (redirectTo) router.push(redirectTo);
              router.refresh();
            }}
          >
            {pending ? "Deleting…" : "Yes, delete"}
          </Button>
          <Button variant="ghost" className={buttonXs} onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button variant="danger" className={buttonSm} onClick={() => setOpen(true)}>
          {label}
        </Button>
      )}
      {message ? <p className="text-sm text-ink-soft">{message}</p> : null}
    </div>
  );
}

export function CoffeeOrderButtons({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<"up" | "down" | null>(null);
  async function move(direction: "up" | "down") {
    setPending(direction);
    await moveCoffee(id, direction);
    router.refresh();
    setPending(null);
  }
  return (
    <div className="inline-flex gap-1.5">
      <Button variant="secondary" className={buttonXs} disabled={pending !== null} onClick={() => move("up")}>
        Up
      </Button>
      <Button variant="secondary" className={buttonXs} disabled={pending !== null} onClick={() => move("down")}>
        Down
      </Button>
    </div>
  );
}
