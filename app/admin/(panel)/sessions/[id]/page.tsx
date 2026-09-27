import { BackLink, PageHeader, SectionAction, SectionTitle } from "@/components/admin/PageHeader";
import { ActiveToggle, DeleteButton } from "@/components/admin/RecordActions";
import { SessionForm } from "@/components/admin/SessionForm";
import { StatusBadge } from "@/components/ui/badge";
import { buttonClasses, buttonSm, buttonXs } from "@/components/ui/button";
import { getCoffees, getEvents, getSession } from "@/lib/data/admin";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [session, events, coffees] = await Promise.all([getSession(id), getEvents(), getCoffees(id)]);
  if (!session) notFound();

  return (
    <div>
      <PageHeader
        eyebrow={<BackLink href="/admin/sessions">Sessions</BackLink>}
        title={session.name}
        description={session.description ?? undefined}
        action={
          <>
            <StatusBadge active={session.active} />
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
            {coffees.map((coffee, index) => (
              <li key={coffee.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="w-6 text-ink-mute tabular">{index + 1}.</span>
                <span className="min-w-0 flex-1 truncate font-medium text-ink">{coffee.lot_name}</span>
                <StatusBadge active={coffee.active} />
                <Link href={`/admin/coffees/${coffee.id}`} className={buttonClasses("secondary", buttonXs)}>
                  Edit
                </Link>
              </li>
            ))}
            {coffees.length === 0 ? <li className="px-4 py-8 text-center text-sm text-ink-soft">No coffees in this session yet.</li> : null}
          </ol>
          <div className="mt-3">
            <Link href={`/admin/coffees?session=${session.id}`} className={buttonClasses("ghost", buttonSm)}>
              Reorder on the coffee lots page
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
