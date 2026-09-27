import { LoginForm } from "@/components/admin/LoginForm";
import { Brand } from "@/components/ui/brand";
import { buttonClasses, buttonSm } from "@/components/ui/button";
import { Alert } from "@/components/ui/field";
import { isAuthConfigured } from "@/lib/supabase/admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

const MESSAGES: Record<string, string> = {
  unauthorized: "This account does not have administrator access.",
  config: "Supabase is not configured yet. Add the environment variables, then sign in.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const query = await searchParams;
  const message = query.error ? MESSAGES[query.error] : null;
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-6 sm:py-10">
      <header className="flex items-center justify-between gap-4">
        <Brand compact />
        <Link href="/" className={buttonClasses("ghost", buttonSm)}>
          Back to sessions
        </Link>
      </header>
      <div className="card my-auto animate-rise p-6 sm:p-8">
        <p className="eyebrow">Organizers</p>
        <h1 className="mt-2 font-display text-[34px] leading-[1.1] text-ink sm:text-4xl">Sign in</h1>
        <p className="mt-3 text-[15px] leading-6 text-ink-soft">Participants never need an account. This area is only for cupping organizers.</p>
        <div className="mt-7 space-y-4">
          {message ? <Alert>{message}</Alert> : null}
          <LoginForm nextPath={query.next} configured={isAuthConfigured()} />
        </div>
      </div>
    </main>
  );
}
