import { PageHeader } from "@/components/admin/PageHeader";
import { QRGenerator } from "@/components/admin/QRGenerator";
import { getSessions } from "@/lib/data/admin";
import { sharePaths } from "@/lib/share";
import { getAppUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

export default async function QRCodesPage() {
  const [sessions, appUrl] = await Promise.all([getSessions(), getAppUrl()]);
  return (
    <div>
      <PageHeader
        title="QR codes"
        description="One QR per table for cuppers. Copy the review link for notes and scores, and the table-setup link for the lab."
      />
      <div className="space-y-4">
        {sessions.map((session) => {
          const paths = sharePaths(session.slug, session.id);
          return (
            <QRGenerator
              key={session.id}
              name={session.name}
              slug={session.slug}
              cuppingUrl={`${appUrl}/session/${session.slug}`}
              reviewUrl={`${appUrl}${paths.review}`}
              tableUrl={`${appUrl}${paths.table}`}
              active={session.active}
            />
          );
        })}
      </div>
      {sessions.length === 0 ? <p className="card px-5 py-12 text-center text-sm text-ink-soft">Create a session to generate a QR code.</p> : null}
    </div>
  );
}
