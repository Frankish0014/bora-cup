import { SessionEntry } from "@/components/participant/SessionEntry";
import { StatusScreen } from "@/components/shared/StatusScreen";
import { findRunForSlug, getCoffeesForSession, getSessionBySlug } from "@/lib/data/cupping";
import { ConfigError } from "@/lib/errors";
import { isSlug } from "@/lib/utils";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function loadSession(slug: string) {
  try {
    const session = await getSessionBySlug(slug);
    if (!session) return { status: "missing" as const };
    if (!session.active) {
      const run = await findRunForSlug(slug);
      if (run) return { status: "resume" as const };
      return { status: "inactive" as const };
    }
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
  if (loaded.status === "resume") return redirect(`/session/${slug}/cup`);
  return (
    <SessionEntry
      slug={loaded.session.slug}
      sessionName={loaded.session.name}
      category={loaded.session.category}
      description={loaded.session.description}
      eventName={loaded.session.event?.name ?? loaded.session.name}
      eventDescription={loaded.session.event?.description ?? null}
      formPolicy={loaded.session.form_policy === "choice" ? "choice" : "locked"}
      formType={loaded.session.form_type ?? "bora"}
      coffeeCount={loaded.coffeeCount}
      notice={query.notice}
    />
  );
}
