"use client";

import { createBrowserSupabase } from "@/lib/supabase/browser";
import { safeAdminPath } from "@/lib/utils";
import { Alert, Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({ nextPath, configured }: { nextPath?: string; configured: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!configured) {
          setMessage("Add the Supabase URL and anon key before signing in.");
          return;
        }
        const form = new FormData(event.currentTarget);
        setPending(true);
        setMessage(null);
        const supabase = createBrowserSupabase();
        const { error } = await supabase.auth.signInWithPassword({
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
        });
        setPending(false);
        if (error) {
          setMessage("Those sign-in details were not recognized.");
          return;
        }
        router.push(safeAdminPath(nextPath));
        router.refresh();
      }}
    >
      {message ? <Alert>{message}</Alert> : null}
      <Field label="Email">
        <Input name="email" type="email" autoComplete="username" required />
      </Field>
      <Field label="Password">
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      <Button type="submit" className="mt-2 w-full min-h-13" disabled={pending || !configured}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
