import { EventForm } from "@/components/admin/EventForm";
import { BackLink, PageHeader, SectionAction, SectionTitle } from "@/components/admin/PageHeader";
import { ActiveToggle, DeleteButton } from "@/components/admin/RecordActions";
import { StatusBadge } from "@/components/ui/badge";
import { buttonClasses, buttonXs } from "@/components/ui/button";
import { getEvent, getSessions } from "@/lib/data/admin";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();
  const sessions = (await getSessions()).filter((session) => session.event_id === id);

  return (
    <div>
      <PageHeader
        eyebrow={<BackLink href="/admin/events">Events</BackLink>}
        title={event.name}
        description={event.description ?? undefined}
        action={
          <>
            <StatusBadge active={event.active} />
            <ActiveToggle kind="event" id={id} active={event.active} />
            <DeleteButton kind="event" id={id} label="Delete" confirmText="Delete this event?" redirectTo="/admin/events" />
          </>
        }
      />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <EventForm id={event.id} defaults={event} />
        <aside>
          <SectionTitle action={<SectionAction href="/admin/sessions/new">Add session</SectionAction>}>Sessions</SectionTitle>
          <ul className="card divide-y divide-line">
            {sessions.map((session) => (
              <li key={session.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="min-w-0 flex-1 truncate font-medium text-ink">{session.name}</span>
                <StatusBadge active={session.active} />
                <Link href={`/admin/sessions/${session.id}`} className={buttonClasses("secondary", buttonXs)}>
                  Edit
                </Link>
              </li>
            ))}
            {sessions.length === 0 ? <li className="px-4 py-8 text-center text-sm text-ink-soft">No sessions for this event yet.</li> : null}
          </ul>
        </aside>
      </div>
    </div>
  );
}
