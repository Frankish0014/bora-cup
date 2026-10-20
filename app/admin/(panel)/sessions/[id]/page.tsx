import { BackLink, PageHeader, SectionAction, SectionTitle } from "@/components/admin/PageHeader";
import { ActiveToggle, DeleteButton, JoinToggle, RemoveCupperButton } from "@/components/admin/RecordActions";
import { SessionForm } from "@/components/admin/SessionForm";
import { Badge, StatusBadge, TableStatusBadge } from "@/components/ui/badge";
import { buttonClasses, buttonSm, buttonXs } from "@/components/ui/button";
import { CopyLink } from "@/components/ui/CopyLink";
import { getCoffees, getEvents, getSession, getSessionCuppers } from "@/lib/data/admin";
import { sharePaths } from "@/lib/share";
import { getAppUrl } from "@/lib/url";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [session, events, coffees, cuppers, appUrl] = await Promise.all([getSession(id), getEvents(), getCoffees(id), getSessionCuppers(id), getAppUrl()]);
  if (!session) notFound();
  const paths = sharePaths(session.slug, session.id);
  const reviewUrl = `${appUrl}${paths.review}`;
  const tableUrl = `${appUrl}${paths.table}`;
  let cup = 0;
  const cups = coffees.map((coffee) => {
    if (coffee.active) cup += 1;
    return { coffee, cup: coffee.active ? cup : null };
  });

  return (
    <div>
      <PageHeader
        eyebrow={<BackLink href="/admin/sessions">Sessions</BackLink>}
        title={session.name}
        description={session.description ?? undefined}
        action={
          <>
            <StatusBadge active={session.active} />
            <TableStatusBadge open={session.joining_open !== false} />
            <CopyLink url={reviewUrl} label="Copy review link" />
            <Link className={buttonClasses("secondary", buttonSm)} href={paths.table} target="_blank" rel="noreferrer">
              Table setup
            </Link>
            <Link className={buttonClasses("secondary", buttonSm)} href="/admin/qr-codes">
              QR code
            </Link>
            <ActiveToggle kind="session" id={id} active={session.active} />
            <DeleteButton kind="session" id={id} label="Delete" confirmText="Delete this session?" redirectTo="/admin/sessions" />
          </>
        }
      />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <SessionForm id={session.id} events={events} defaults={session} />
        <aside>
          <SectionTitle action={<SectionAction href={`/admin/coffees/new?session=${session.id}`}>Add coffee</SectionAction>}>Coffee lots</SectionTitle>
          <ol className="card divide-y divide-line">
            {cups.map(({ coffee, cup: cupNumber }) => (
              <li key={coffee.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="w-14 shrink-0 text-xs text-ink-mute tabular">{cupNumber == null ? "Off" : `Cup ${cupNumber}`}</span>
                <span className="min-w-0 flex-1 truncate font-medium text-ink">{coffee.lot_name}</span>
                <StatusBadge active={coffee.active} />
                <Link href={`/admin/coffees/${coffee.id}`} className={buttonClasses("secondary", buttonXs)}>
                  Edit
                </Link>
              </li>
            ))}
            {coffees.length === 0 ? <li className="px-4 py-8 text-center text-sm text-ink-soft">No coffees in this session yet.</li> : null}
          </ol>
          <p className="mt-3 text-sm leading-6 text-ink-soft">
            Cup 1 is the first lot cuppers see. Open the table-setup link so the lab places cups left to right in this order.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/admin/coffees?session=${session.id}`} className={buttonClasses("ghost", buttonSm)}>
              Reorder lots
            </Link>
            <CopyLink url={tableUrl} label="Copy table link" className={buttonSm} />
          </div>
        </aside>
      </div>

      <section className="mt-10">
        <SectionTitle
          action={<JoinToggle id={id} open={session.joining_open !== false} />}
          description="After everyone in the room has joined, close the table so the QR cannot add extra cuppers. People already on this sheet can still finish. Remove anyone who should not count."
        >
          Table
        </SectionTitle>
        <ul className="card divide-y divide-line">
          {cuppers.map((cupper) => (
            <li key={cupper.runId} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <Link href={`/admin/participants/${cupper.participantId}`} className="font-medium text-ink hover:underline">
                  {cupper.name}
                </Link>
                <p className="mt-0.5 text-xs text-ink-mute">
                  {cupper.email} · {cupper.country}
                </p>
              </div>
              {cupper.status === "completed" ? <Badge tone="leaf">Submitted</Badge> : <Badge>In progress</Badge>}
              <span className="text-xs text-ink-mute tabular">
                {cupper.cupsRated} {cupper.cupsRated === 1 ? "cup" : "cups"} · {formatDateTime(cupper.completedAt ?? cupper.startedAt)}
              </span>
              <RemoveCupperButton runId={cupper.runId} name={cupper.name} />
            </li>
          ))}
          {cuppers.length === 0 ? <li className="px-4 py-8 text-center text-sm text-ink-soft">No one has joined this table yet.</li> : null}
        </ul>
      </section>
    </div>
  );
}
