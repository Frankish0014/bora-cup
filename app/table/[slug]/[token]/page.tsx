import { TableMap } from "@/components/review/TableMap";
import { StatusScreen } from "@/components/shared/StatusScreen";
import { getSharedTable } from "@/lib/data/review";
import { getAppUrl } from "@/lib/url";
import { isSlug } from "@/lib/utils";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Table setup",
  robots: { index: false, follow: false },
};

export default async function TableSetupPage({ params }: { params: Promise<{ slug: string; token: string }> }) {
  const { slug, token } = await params;
  if (!isSlug(slug)) {
    return <StatusScreen title="Table map not found" message="This setup link is not valid." />;
  }

  const shared = await getSharedTable(slug, token);
  if (!shared) {
    return <StatusScreen title="Table map not found" message="This setup link is not valid, or the session is no longer available." />;
  }

  const appUrl = await getAppUrl();
  const eventName = shared.session.event?.name ?? shared.session.name;
  return (
    <TableMap
      eventName={eventName}
      sessionName={shared.session.name}
      category={shared.session.category}
      coffees={shared.coffees}
      tableUrl={`${appUrl}/table/${shared.session.slug}/${token}`}
      reviewHref={`/review/${shared.session.slug}/${token}`}
      cuppingHref={`${appUrl}/session/${shared.session.slug}`}
    />
  );
}
