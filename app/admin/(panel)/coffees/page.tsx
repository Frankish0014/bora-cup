import { CoffeeOrderButtons } from "@/components/admin/RecordActions";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/ui/badge";
import { buttonClasses, buttonSm, buttonXs } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { EmptyRow, TD, TH, TR, Table, TableShell } from "@/components/ui/table";
import { getCoffees, getSessions } from "@/lib/data/admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CoffeesPage({ searchParams }: { searchParams: Promise<{ session?: string }> }) {
  const query = await searchParams;
  const [sessions, coffees] = await Promise.all([getSessions(), getCoffees(query.session)]);
  return (
    <div>
      <PageHeader
        title="Coffee lots"
        description="Participants see lots in this order. Only filled fields are shown on the cupping sheet."
        action={
          <Link className={buttonClasses("primary", buttonSm)} href="/admin/coffees/new">
            Add coffee
          </Link>
        }
      />
      <form className="mb-4 flex flex-wrap items-end gap-2" method="get">
        <label className="block w-full sm:w-72">
          <span className="mb-1.5 block text-xs font-medium text-ink-soft">Session</span>
          <Select id="session-filter" name="session" defaultValue={query.session ?? ""} className="min-h-11">
            <option value="">All sessions</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.name}
              </option>
            ))}
          </Select>
        </label>
        <button className={buttonClasses("secondary", "min-h-11 rounded-lg px-4 text-sm")} type="submit">
          Filter
        </button>
      </form>
      <TableShell>
        <Table className="min-w-[820px]">
          <thead>
            <tr>
              <TH className="w-14">#</TH>
              <TH>Lot</TH>
              <TH>Session</TH>
              <TH>Code</TH>
              <TH className="w-32">Order</TH>
              <TH className="w-32">Status</TH>
              <TH className="w-24 text-right">Actions</TH>
            </tr>
          </thead>
          <tbody>
            {coffees.map((coffee, index) => (
              <TR key={coffee.id}>
                <TD className="text-ink-mute tabular">{String(index + 1).padStart(2, "0")}</TD>
                <TD>
                  <Link className="font-medium text-ink hover:underline" href={`/admin/coffees/${coffee.id}`}>
                    {coffee.lot_name}
                  </Link>
                  {[coffee.washing_station, coffee.district].filter(Boolean).length > 0 ? (
                    <span className="mt-0.5 block text-xs text-ink-soft">{[coffee.washing_station, coffee.district].filter(Boolean).join(" · ")}</span>
                  ) : null}
                </TD>
                <TD className="text-ink-soft">{coffee.sessionName}</TD>
                <TD>
                  {coffee.cupping_code ? (
                    <code className="rounded bg-paper px-1.5 py-0.5 font-mono text-xs text-ink-soft">{coffee.cupping_code}</code>
                  ) : (
                    <span className="text-ink-mute">—</span>
                  )}
                </TD>
                <TD>
                  <CoffeeOrderButtons id={coffee.id} />
                </TD>
                <TD>
                  <StatusBadge active={coffee.active} />
                </TD>
                <TD className="text-right">
                  <Link className={buttonClasses("secondary", buttonXs)} href={`/admin/coffees/${coffee.id}`}>
                    Edit
                  </Link>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
        {coffees.length === 0 ? <EmptyRow>No coffee lots yet.</EmptyRow> : null}
      </TableShell>
    </div>
  );
}
