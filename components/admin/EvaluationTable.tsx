import { EmptyRow, TD, TH, TR, Table, TableShell } from "@/components/ui/table";
import type { EvaluationView } from "@/lib/data/admin";
import { formatNotes } from "@/lib/cupping";
import { ratingLabel } from "@/lib/ratings";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";

export function EvaluationTable({ rows }: { rows: EvaluationView[] }) {
  if (rows.length === 0) {
    return (
      <TableShell>
        <EmptyRow>No evaluations match these filters.</EmptyRow>
      </TableShell>
    );
  }

  return (
    <>
      <TableShell className="hidden md:block">
        <Table className="min-w-[880px]">
          <thead>
            <tr>
              <TH>Participant</TH>
              <TH>Coffee</TH>
              <TH>Rating</TH>
              <TH>Notes</TH>
              <TH>Updated</TH>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <TR key={row.id}>
                <TD className="align-top">
                  <Link href={`/admin/participants/${row.participant.id}`} className="font-medium text-ink hover:underline">
                    {row.participant.name}
                  </Link>
                  <span className="mt-0.5 block text-xs text-ink-mute">{row.participant.country}</span>
                </TD>
                <TD className="align-top">
                  <span className="block text-ink">{row.coffee.lot_name}</span>
                  <span className="mt-0.5 block text-xs text-ink-mute">{row.session.name}</span>
                </TD>
                <TD className="align-top whitespace-nowrap">{ratingLabel(row.overall_score)}</TD>
                <TD className="max-w-sm align-top text-ink-soft">
                  <Notes text={formatNotes(row.comments)} />
                </TD>
                <TD className="align-top text-xs whitespace-nowrap text-ink-mute tabular">{formatDateTime(row.updated_at)}</TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </TableShell>

      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="card p-4 text-[15px]">
            <div className="flex items-baseline justify-between gap-3">
              <Link href={`/admin/participants/${row.participant.id}`} className="font-medium text-ink">
                {row.participant.name}
              </Link>
              <span className="text-xs text-ink-mute tabular">{formatDateTime(row.updated_at)}</span>
            </div>
            <p className="mt-0.5 text-sm text-ink-soft">
              {row.coffee.lot_name} · {row.session.name}
            </p>
            <p className="mt-3 text-sm font-medium text-ink">{ratingLabel(row.overall_score)}</p>
            <Notes text={formatNotes(row.comments)} className="mt-3" />
          </li>
        ))}
      </ul>
    </>
  );
}

function Notes({ text, className = "" }: { text: string | null; className?: string }) {
  if (!text) return <span className="text-ink-mute">—</span>;
  return <span className={`block leading-6 whitespace-pre-wrap ${className}`}>{text}</span>;
}
