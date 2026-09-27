import { SubmissionConfirmation } from "@/components/cupping/SubmissionConfirmation";
import { buttonClasses } from "@/components/ui/button";
import { StatusScreen } from "@/components/shared/StatusScreen";
import { findRunForSlug, getSessionBySlug } from "@/lib/data/cupping";
import { ConfigError } from "@/lib/errors";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function loadCompletion(slug: string) {
  try {
    const session = await getSessionBySlug(slug);
    if (!session) return { status: "missing" as const };
    const run = await findRunForSlug(slug);
    if (run?.status === "in_progress") return { status: "cup" as const };
    if (run?.status === "completed") return { status: "done" as const };
    return { status: "unknown" as const };
  } catch (error) {
    if (error instanceof ConfigError) return { status: "setup" as const };
    throw error;
  }
}

export default async function CompletePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const loaded = await loadCompletion(slug);
  if (loaded.status === "setup") {
    return <StatusScreen title="Setup needed" message="This cupping session is not available until the database is connected." />;
  }
  if (loaded.status === "missing") {
    return <StatusScreen title="Session not found" message="We couldn't find that cupping session. Check the QR code and try again." />;
  }
  if (loaded.status === "cup") redirect(`/session/${slug}/cup`);
  if (loaded.status === "done") return <SubmissionConfirmation />;
  return (
    <StatusScreen tone="success" title="Thank you" message="If you just submitted, your feedback has been saved. Otherwise, start again from the session link.">
      <Link href={`/session/${slug}`} className={buttonClasses("primary")}>
        Back to session
      </Link>
    </StatusScreen>
  );
}
