import { BackLink, PageHeader } from "@/components/admin/PageHeader";
import { SessionForm } from "@/components/admin/SessionForm";
import { Alert } from "@/components/ui/field";
import { getEvents } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function NewSessionPage() {
  const events = await getEvents();
  return (
    <div>
      <PageHeader
        eyebrow={<BackLink href="/admin/sessions">Sessions</BackLink>}
        title="New session"
        description="The slug becomes the QR link, for example /session/special-process."
      />
      {events.length === 0 ? <Alert tone="info">Create an event before adding a session.</Alert> : <SessionForm events={events} />}
    </div>
  );
}
