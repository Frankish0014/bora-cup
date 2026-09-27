import { EventForm } from "@/components/admin/EventForm";
import { BackLink, PageHeader } from "@/components/admin/PageHeader";

export const dynamic = "force-dynamic";

export default function NewEventPage() {
  return (
    <div>
      <PageHeader eyebrow={<BackLink href="/admin/events">Events</BackLink>} title="New event" description="An event groups one or more cupping sessions." />
      <EventForm />
    </div>
  );
}
