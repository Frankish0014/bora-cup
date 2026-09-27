import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/ui/badge";
import { buttonClasses, buttonSm, buttonXs } from "@/components/ui/button";
import { EmptyRow, TD, TH, TR, Table, TableShell } from "@/components/ui/table";
import { getSessions } from "@/lib/data/admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const sessions = await getSessions();
  return (
    <div>
      <PageHeader
        title="Sessions"
        description="Each session has its own QR code and its own coffee sequence."
        action={
          <Link className={buttonClasses("primary", buttonSm)} href="/admin/sessions/new">
            Add session
          </Link>
        }
      />
      <TableShell>
        <Table className="min-w-[760px]">
          <thead>
            <tr>
              <TH>Name</TH>
              <TH>Category</TH>
              <TH>Event</TH>
              <TH>Link</TH>
              <TH className="w-32">Status</TH>
              <TH className="w-24 text-right">Actions</TH>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <TR key={session.id}>
                <TD>
                  <Link className="font-medium text-ink hover:underline" href={`/admin/sessions/${session.id}`}>
                    {session.name}
                  </Link>
                </TD>
                <TD className="text-ink-soft">{session.category}</TD>
                <TD className="text-ink-soft">{session.eventName}</TD>
                <TD>
                  <code className="rounded bg-paper px-1.5 py-0.5 font-mono text-xs text-ink-soft">/session/{session.slug}</code>
                </TD>
                <TD>
                  <StatusBadge active={session.active} />
                </TD>
                <TD className="text-right">
                  <Link className={buttonClasses("secondary", buttonXs)} href={`/admin/sessions/${session.id}`}>
                    Edit
                  </Link>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
        {sessions.length === 0 ? <EmptyRow>No sessions yet.</EmptyRow> : null}
      </TableShell>
    </div>
  );
}
