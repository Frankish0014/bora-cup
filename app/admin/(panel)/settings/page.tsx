import { PageHeader, SectionTitle } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/badge";
import { RATING_OPTIONS } from "@/lib/ratings";
import { isAuthConfigured, isSupabaseConfigured } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const appUrl = await getAppUrl();
  const database = isSupabaseConfigured();
  const auth = isAuthConfigured();
  return (
    <div>
      <PageHeader title="Settings" description="The cupping scale and connection status for this deployment." />
      <dl className="card divide-y divide-line">
        <Row term="App URL" detail={appUrl || "Not set"} />
        <Row term="Database" detail={database ? "Connected" : "Missing service role key or URL"} ok={database} />
        <Row term="Admin sign-in" detail={auth ? "Connected" : "Missing anon key or URL"} ok={auth} />
      </dl>

      <section className="mt-10">
        <SectionTitle description="Participants must write aroma, flavor, and overall, then choose one rating on this scale.">Rating scale</SectionTitle>
        <ol className="card divide-y divide-line">
          {RATING_OPTIONS.map((option) => (
            <li key={option.score} className="flex items-center gap-4 px-5 py-3 text-[15px]">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink font-display text-base text-white tabular">{option.score}</span>
              <span className="font-medium text-ink">{option.label}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10 max-w-2xl">
        <SectionTitle>Administrators</SectionTitle>
        <div className="card p-5 text-[15px] leading-7 text-ink-soft">
          <p>
            Create a user in Supabase Authentication, then add their id to <code className="rounded bg-paper px-1.5 py-0.5 font-mono text-sm text-ink">admin_profiles</code>. The seed script
            does this when <code className="rounded bg-paper px-1.5 py-0.5 font-mono text-sm text-ink">ADMIN_EMAIL</code> and{" "}
            <code className="rounded bg-paper px-1.5 py-0.5 font-mono text-sm text-ink">ADMIN_PASSWORD</code> are set.
          </p>
          <p className="mt-3">Results and participant details are never public. Only signed-in administrators can see this area.</p>
        </div>
      </section>
    </div>
  );
}

function Row({ term, detail, ok }: { term: string; detail: string; ok?: boolean }) {
  return (
    <div className="grid gap-1 px-5 py-3.5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-sm text-ink-mute">{term}</dt>
      <dd className="flex flex-wrap items-center gap-2 break-all text-[15px] text-ink">
        {ok === undefined ? detail : <Badge tone={ok ? "leaf" : "neutral"}>{detail}</Badge>}
      </dd>
    </div>
  );
}
