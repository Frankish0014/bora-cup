import { CuppingExperience } from "@/components/cupping/CuppingExperience";
import { StatusScreen } from "@/components/shared/StatusScreen";
import { findRunForSlug, getCoffeesForSession, getEvaluationsForRun, getSessionBySlug } from "@/lib/data/cupping";
import { ConfigError } from "@/lib/errors";
import { isSlug } from "@/lib/utils";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function loadCup(slug: string) {
  try {
    const session = await getSessionBySlug(slug);
    if (!session) return { status: "missing" as const };
    if (!session.active) return { status: "inactive" as const };
    const coffees = await getCoffeesForSession(session.id, true);
    if (coffees.length === 0) return { status: "empty" as const };
    const run = await findRunForSlug(slug);
    if (!run) return { status: "start" as const };
    if (run.status === "completed") return { status: "done" as const };
    const evaluations = await getEvaluationsForRun(run.id);
    return { status: "ready" as const, session, coffees, run, evaluations };
  } catch (error) {
    if (error instanceof ConfigError) return { status: "setup" as const };
    throw error;
  }
}

export default async function CupPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ i?: string; view?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  if (!isSlug(slug)) {
    return <StatusScreen title="Session not found" message="We couldn't find that cupping session. Check the QR code and try again." />;
  }

  const loaded = await loadCup(slug);
  if (loaded.status === "setup") {
    return <StatusScreen title="Setup needed" message="This cupping session is not available until the database is connected." />;
  }
  if (loaded.status === "missing") {
    return <StatusScreen title="Session not found" message="We couldn't find that cupping session. Check the QR code and try again." />;
  }
  if (loaded.status === "inactive") {
    return <StatusScreen title="Session closed" message="This cupping session is not open right now." />;
  }
  if (loaded.status === "empty") {
    return <StatusScreen title="No coffees yet" message="No coffees are available in this session yet." />;
  }
  if (loaded.status === "start") redirect(`/session/${slug}?notice=start`);
  if (loaded.status === "done") redirect(`/session/${slug}/complete`);

  return (
    <CuppingExperience
      slug={slug}
      sessionName={loaded.session.name}
      participantSessionId={loaded.run.id}
      coffees={loaded.coffees}
      evaluations={loaded.evaluations}
      initialIndex={Number(query.i ?? 0) || 0}
      initialView={query.view === "review" ? "review" : "cup"}
    />
  );
}
