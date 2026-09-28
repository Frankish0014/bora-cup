import { CompetitionNote } from "@/components/shared/CompetitionNote";
import { Brand } from "@/components/ui/brand";
import { buttonClasses, buttonSm } from "@/components/ui/button";
import { COMPETITION_STATS } from "@/lib/content/competition";
import { getActiveSessions } from "@/lib/data/cupping";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let sessions: Awaited<ReturnType<typeof getActiveSessions>> = [];
  let unavailable = false;
  const configured = isSupabaseConfigured();
  if (configured) {
    try {
      sessions = await getActiveSessions();
    } catch {
      unavailable = true;
    }
  }
  const eventName = sessions.find((session) => session.eventName)?.eventName ?? "Best of Rwanda Cup Tour";

  return (
    <main className="mx-auto min-h-dvh w-full max-w-6xl px-3 py-4 sm:px-5 sm:py-6">
      <header className="flex items-center justify-between gap-3 rounded-[1.35rem] border border-line bg-foam px-4 py-3 shadow-card">
        <Brand compact />
        <Link href="/admin/login" className={buttonClasses("secondary", buttonSm)}>
          Organizer sign in
        </Link>
      </header>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <section className="card flex flex-col justify-between bg-leaf p-6 text-white sm:p-8 lg:col-span-2">
          <p className="text-sm font-medium text-white/80">{eventName}</p>
          <div className="mt-8">
            <h1 className="text-4xl leading-[1.05] text-white sm:text-5xl">Digital cupping</h1>
            <p className="mt-4 max-w-sm text-[15px] leading-7 text-white/80">Scroll through the coffees, write your notes, and save the session once. No account needed.</p>
          </div>
          <p className="mt-8 text-sm text-white/70">At the table, scan the QR code for your session.</p>
        </section>

        <section className="lg:col-span-3" aria-labelledby="sessions">
          <div className="mb-3 flex items-baseline justify-between px-1">
            <h2 id="sessions" className="text-sm font-semibold text-ink">
              Open sessions
            </h2>
            {sessions.length > 0 ? <span className="text-xs text-ink-mute tabular">{sessions.length}</span> : null}
          </div>
          {sessions.length > 0 ? (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {sessions.map((session) => (
                <li key={session.id} className="card flex items-center justify-between gap-3 p-4">
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold text-ink">{session.name}</span>
                    <span className="mt-0.5 block text-sm text-ink-soft">
                      {session.category} · {session.coffeeCount} {session.coffeeCount === 1 ? "coffee" : "coffees"}
                    </span>
                  </span>
                  <Link href={`/session/${session.slug}`} className={buttonClasses("primary", `${buttonSm} shrink-0`)}>
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="card px-6 py-10 text-center">
              <p className="text-[15px] leading-7 text-ink-soft">
                {unavailable
                  ? "Sessions are temporarily unavailable. Please try again in a moment."
                  : configured
                    ? "No sessions are open right now."
                    : "Database setup is still needed on this server."}
              </p>
            </div>
          )}
        </section>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
        {COMPETITION_STATS.map((stat) => (
          <div key={stat.label} className="card p-4 sm:p-5">
            <dt className="font-display text-3xl leading-none text-ink tabular">{stat.value}</dt>
            <dd className="mt-2 text-sm text-ink-soft">{stat.label}</dd>
          </div>
        ))}
      </dl>

      <CompetitionNote />

      <footer className="px-1 pt-10 text-xs leading-5 text-ink-mute">
        Organized by NAEB in partnership with CEPAR.
        <span className="mt-1 block">This cupping app records feedback. It is not the public auction.</span>
      </footer>
    </main>
  );
}
