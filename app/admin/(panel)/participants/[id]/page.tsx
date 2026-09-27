import { BackLink, PageHeader, SectionTitle } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/badge";
import { getParticipantDetail } from "@/lib/data/admin";
import { formatNotes } from "@/lib/cupping";
import { ratingLabel } from "@/lib/ratings";
import { formatDateTime } from "@/lib/utils";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ParticipantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getParticipantDetail(id);
  if (!detail) notFound();
  const { participant } = detail;
  return (
    <div>
      <PageHeader eyebrow={<BackLink href="/admin/participants">Participants</BackLink>} title={participant.name} description={`${participant.email} · ${participant.country}`} />
      <dl className="card grid gap-5 p-5 sm:grid-cols-2">
        <Row term="Organization" detail={participant.organization ?? "—"} />
        <Row term="Role" detail={participant.role ?? "—"} />
      </dl>

      <section className="mt-10">
        <SectionTitle>Sessions</SectionTitle>
        <ul className="card divide-y divide-line">
          {detail.runs.map((run) => (
            <li key={run.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-[15px]">
              <span className="font-medium text-ink">{run.sessionName}</span>
              {run.status === "completed" ? (
                <span className="flex items-center gap-2 text-sm text-ink-soft">
                  <Badge tone="leaf">Completed</Badge>
                  <span className="tabular">{formatDateTime(run.completed_at)}</span>
                </span>
              ) : (
                <Badge>In progress</Badge>
              )}
            </li>
          ))}
          {detail.runs.length === 0 ? <li className="px-5 py-8 text-center text-sm text-ink-soft">No sessions yet.</li> : null}
        </ul>
      </section>

      <section className="mt-10">
        <SectionTitle>Evaluations</SectionTitle>
        <ol className="space-y-3">
          {detail.evaluations.map((evaluation) => {
            const notes = formatNotes(evaluation.comments);
            return (
              <li key={evaluation.id} className="card p-5">
                <p className="text-xs font-medium text-ink-mute">{evaluation.sessionName}</p>
                <h3 className="mt-1 text-[17px] font-semibold tracking-tight text-ink">{evaluation.coffeeName}</h3>
                <dl className="mt-4 max-w-xs">
                  <Score label="Rating" text={ratingLabel(evaluation.overall_score)} />
                </dl>
                {notes ? <p className="mt-4 border-t border-line pt-3 text-sm leading-6 text-ink-soft whitespace-pre-wrap">{notes}</p> : null}
              </li>
            );
          })}
        </ol>
        {detail.evaluations.length === 0 ? <p className="card px-5 py-8 text-center text-sm text-ink-soft">No evaluations yet.</p> : null}
      </section>
    </div>
  );
}

function Row({ term, detail }: { term: string; detail: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-ink-mute">{term}</dt>
      <dd className="mt-1 text-[15px] text-ink">{detail}</dd>
    </div>
  );
}

function Score({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-lg bg-paper px-3 py-2">
      <dt className="text-[11px] font-medium text-ink-mute">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-ink">{text}</dd>
    </div>
  );
}
