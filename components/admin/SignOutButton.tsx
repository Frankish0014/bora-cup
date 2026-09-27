"use client";

import { Button, buttonSm } from "@/components/ui/button";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      className={buttonSm}
      onClick={async () => {
        const supabase = createBrowserSupabase();
        await supabase.auth.signOut();
        router.push("/admin/login");
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
