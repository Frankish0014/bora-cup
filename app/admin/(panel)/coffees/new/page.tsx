import { CoffeeForm } from "@/components/admin/CoffeeForm";
import { BackLink, PageHeader } from "@/components/admin/PageHeader";
import { Alert } from "@/components/ui/field";
import { getNextDisplayOrder, getSessions } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function NewCoffeePage({ searchParams }: { searchParams: Promise<{ session?: string }> }) {
  const query = await searchParams;
  const sessions = await getSessions();
  const sessionId = query.session && sessions.some((session) => session.id === query.session) ? query.session : sessions[0]?.id;
  const displayOrder = sessionId ? await getNextDisplayOrder(sessionId) : 1;
  return (
    <div>
      <PageHeader
        eyebrow={<BackLink href="/admin/coffees">Coffee lots</BackLink>}
        title="New coffee"
        description="Leave a field blank if it should stay hidden on the cupping sheet."
      />
      {sessions.length === 0 ? (
        <Alert tone="info">Create a session before adding coffee.</Alert>
      ) : (
        <CoffeeForm sessions={sessions} defaults={{ session_id: sessionId, display_order: displayOrder, country: "Rwanda", active: true }} />
      )}
    </div>
  );
}
