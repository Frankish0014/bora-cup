import { SessionEntry } from "@/components/participant/SessionEntry";
import { StatusScreen } from "@/components/shared/StatusScreen";
import { getCoffeesForSession, getSessionBySlug } from "@/lib/data/cupping";
import { ConfigError } from "@/lib/errors";
import { isSlug } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function loadSession(slug: string) {
  try {
    const session = await getSessionBySlug(slug);
    if (!session) return { status: "missing" as const };
    if (!session.active || session.event?.active === false) return { status: "inactive" as const };
    const coffees = await getCoffeesForSession(session.id, true);
    return { status: "ready" as const, session, coffeeCount: coffees.length };
  } catch (error) {
    if (error instanceof ConfigError) return { status: "setup" as const };
    throw error;
  }
}

export default async function SessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  if (!isSlug(slug)) {
    return <StatusScreen title="Session not found" message="We couldn't find that cupping session. Check the QR code and try again." />;
  }

  const loaded = await loadSession(slug);
  if (loaded.status === "setup") {
    return <StatusScreen title="Setup needed" message="This cupping session is not available until the database is connected." />;
  }
  if (loaded.status === "missing") {
    return <StatusScreen title="Session not found" message="We couldn't find that cupping session. Check the QR code and try again." />;
  }
  if (loaded.status === "inactive") {
    return <StatusScreen title="Session closed" message="This cupping session is not open right now." />;
  }
  return (
    <SessionEntry
      slug={loaded.session.slug}
      sessionName={loaded.session.name}
      category={loaded.session.category}
      description={loaded.session.description}
      coffeeCount={loaded.coffeeCount}
      notice={query.notice}
    />
  );
}
