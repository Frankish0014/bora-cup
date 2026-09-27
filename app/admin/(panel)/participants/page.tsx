import { PageHeader } from "@/components/admin/PageHeader";
import { buttonClasses, buttonXs } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { EmptyRow, TD, TH, TR, Table, TableShell } from "@/components/ui/table";
import { getParticipants } from "@/lib/data/admin";
import { sanitizeSearch } from "@/lib/filters";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ParticipantsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = sanitizeSearch((await searchParams).q ?? "");
  const participants = await getParticipants(query || undefined);
  return (
    <div>
      <PageHeader title="Participants" description="Participant details stay inside the admin area and are never shown publicly." />
      <form className="mb-4 flex gap-2" method="get" role="search">
        <label className="flex-1 sm:max-w-sm">
          <span className="sr-only">Search participants</span>
          <Input name="q" defaultValue={query} placeholder="Search by name or email" className="min-h-11" />
        </label>
        <button className={buttonClasses("secondary", "min-h-11 rounded-lg px-4 text-sm")} type="submit">
          Search
        </button>
      </form>
      <TableShell>
        <Table className="min-w-[960px]">
          <thead>
            <tr>
              <TH>Name</TH>
              <TH>Country</TH>
              <TH>Organization</TH>
              <TH>Role</TH>
              <TH>Sessions</TH>
              <TH>Joined</TH>
              <TH className="w-24 text-right">Actions</TH>
            </tr>
          </thead>
          <tbody>
            {participants.map((participant) => (
              <TR key={participant.id}>
                <TD>
                  <Link className="font-medium text-ink hover:underline" href={`/admin/participants/${participant.id}`}>
                    {participant.name}
                  </Link>
                  <span className="mt-0.5 block text-xs text-ink-soft">{participant.email}</span>
                </TD>
                <TD>{participant.country}</TD>
                <TD className="text-ink-soft">{participant.organization ?? "—"}</TD>
                <TD className="text-ink-soft">{participant.role ?? "—"}</TD>
                <TD className="text-ink-soft">{participant.sessions.join(", ") || "—"}</TD>
                <TD className="text-xs text-ink-mute tabular">{formatDateTime(participant.created_at)}</TD>
                <TD className="text-right">
                  <Link className={buttonClasses("secondary", buttonXs)} href={`/admin/participants/${participant.id}`}>
                    View
                  </Link>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
        {participants.length === 0 ? <EmptyRow>{query ? "No participants match that search." : "No participants yet."}</EmptyRow> : null}
      </TableShell>
    </div>
  );
}
