import { CoffeeForm } from "@/components/admin/CoffeeForm";
import { BackLink, PageHeader } from "@/components/admin/PageHeader";
import { DeleteButton } from "@/components/admin/RecordActions";
import { StatusBadge } from "@/components/ui/badge";
import { getCoffee, getSessions } from "@/lib/data/admin";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CoffeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [coffee, sessions] = await Promise.all([getCoffee(id), getSessions()]);
  if (!coffee) notFound();
  return (
    <div>
      <PageHeader
        eyebrow={<BackLink href="/admin/coffees">Coffee lots</BackLink>}
        title={coffee.lot_name}
        description={coffee.cupping_code ? `Cupping code ${coffee.cupping_code}` : undefined}
        action={
          <>
            <StatusBadge active={coffee.active} />
            <DeleteButton kind="coffee" id={id} label="Delete" confirmText="Delete this coffee?" redirectTo="/admin/coffees" />
          </>
        }
      />
      <CoffeeForm id={coffee.id} sessions={sessions} defaults={coffee} />
    </div>
  );
}
