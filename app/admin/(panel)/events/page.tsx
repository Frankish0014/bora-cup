import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/ui/badge";
import { buttonClasses, buttonSm, buttonXs } from "@/components/ui/button";
import { EmptyRow, TD, TH, TR, Table, TableShell } from "@/components/ui/table";
import { getEvents } from "@/lib/data/admin";
import { formatDateOnly } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await getEvents();
  return (
    <div>
      <PageHeader
        title="Events"
        description="A cupping tour can hold more than one event. Each event groups its sessions."
        action={
          <Link className={buttonClasses("primary", buttonSm)} href="/admin/events/new">
            Add event
          </Link>
        }
      />
      <TableShell>
        <Table className="min-w-[640px]">
          <thead>
            <tr>
              <TH>Name</TH>
              <TH>Dates</TH>
              <TH className="w-32">Status</TH>
              <TH className="w-24 text-right">Actions</TH>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <TR key={event.id}>
                <TD>
                  <Link className="font-medium text-ink hover:underline" href={`/admin/events/${event.id}`}>
                    {event.name}
                  </Link>
                  {event.description ? <span className="mt-0.5 block max-w-md truncate text-xs text-ink-soft">{event.description}</span> : null}
                </TD>
                <TD className="text-ink-soft tabular">
                  {formatDateOnly(event.start_date)} – {formatDateOnly(event.end_date)}
                </TD>
                <TD>
                  <StatusBadge active={event.active} />
                </TD>
                <TD className="text-right">
                  <Link className={buttonClasses("secondary", buttonXs)} href={`/admin/events/${event.id}`}>
                    Edit
                  </Link>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
        {events.length === 0 ? <EmptyRow>No events yet. Add the first one to get started.</EmptyRow> : null}
      </TableShell>
    </div>
  );
}
