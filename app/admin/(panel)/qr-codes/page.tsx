import { PageHeader } from "@/components/admin/PageHeader";
import { QRGenerator } from "@/components/admin/QRGenerator";
import { getSessions } from "@/lib/data/admin";
import { getAppUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

export default async function QRCodesPage() {
  const [sessions, appUrl] = await Promise.all([getSessions(), getAppUrl()]);
  return (
    <div>
      <PageHeader title="QR codes" description="Print or display one code per cupping table. Scanning it opens that session's coffees in order." />
      <div className="space-y-4">
        {sessions.map((session) => (
          <QRGenerator key={session.id} name={session.name} slug={session.slug} url={`${appUrl}/session/${session.slug}`} active={session.active} />
        ))}
      </div>
      {sessions.length === 0 ? <p className="card px-5 py-12 text-center text-sm text-ink-soft">Create a session to generate a QR code.</p> : null}
    </div>
  );
}
