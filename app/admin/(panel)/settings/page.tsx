import { OrganizersPanel } from "@/components/admin/OrganizersPanel";
import { PageHeader, SectionTitle } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth";
import { getOrganizers } from "@/lib/data/organizers";
import { RATING_OPTIONS } from "@/lib/ratings";
import { isEmailConfigured } from "@/lib/email";
import { isAuthConfigured, isSupabaseConfigured } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [appUrl, user, organizers] = await Promise.all([getAppUrl(), requireAdmin(), getOrganizers()]);
  const database = isSupabaseConfigured();
  const auth = isAuthConfigured();
  const email = isEmailConfigured();
  return (
    <div>
      <PageHeader title="Settings" description="Connection status, the cupping scale, and who can sign in to manage the cupping." />
      <dl className="card divide-y divide-line">
        <Row term="App URL" detail={appUrl || "Not set"} />
        <Row term="Database" detail={database ? "Connected" : "Missing service role key or URL"} ok={database} />
        <Row term="Admin sign-in" detail={auth ? "Connected" : "Missing anon key or URL"} ok={auth} />
        <Row term="Cupping email" detail={email ? "Welcome and thank-you emails are on" : "Add RESEND_API_KEY and EMAIL_FROM to send mail"} ok={email} />
      </dl>
      {email ? null : (
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
          Create a sending key at{" "}
          <a className="font-medium text-ink underline decoration-line underline-offset-2" href="https://resend.com/api-keys" target="_blank" rel="noreferrer">
            resend.com/api-keys
          </a>
          , verify a domain at{" "}
          <a className="font-medium text-ink underline decoration-line underline-offset-2" href="https://resend.com/domains" target="_blank" rel="noreferrer">
            resend.com/domains
          </a>
          , then set both values in <code className="text-[13px]">.env.local</code> and on Vercel. Restart the app after saving. See the README Resend section for the full walkthrough.
        </p>
      )}

      <section className="mt-10">
        <SectionTitle description="Participants must choose one rating on this scale. Aroma, flavor, and overall notes are optional.">Rating scale</SectionTitle>
        <ol className="card divide-y divide-line">
          {RATING_OPTIONS.map((option) => (
            <li key={option.score} className="flex items-center gap-4 px-5 py-3 text-[15px]">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink font-display text-base text-white tabular">{option.score}</span>
              <span className="font-medium text-ink">{option.label}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <SectionTitle description="Organizers sign in and can add sessions, coffee lots, and everything else in this area.">Organizers</SectionTitle>
        <OrganizersPanel organizers={organizers} currentUserId={user.id} />
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
