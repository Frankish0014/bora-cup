import { ReviewReport } from "@/components/review/ReviewReport";
import { StatusScreen } from "@/components/shared/StatusScreen";
import { getSharedReview } from "@/lib/data/review";
import { getAppUrl } from "@/lib/url";
import { isSlug } from "@/lib/utils";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Session review",
  robots: { index: false, follow: false },
};

export default async function ReviewPage({ params }: { params: Promise<{ slug: string; token: string }> }) {
  const { slug, token } = await params;
  if (!isSlug(slug)) {
    return <StatusScreen title="Review not found" message="This review link is not valid." />;
  }

  const review = await getSharedReview(slug, token);
  if (!review) {
    return <StatusScreen title="Review not found" message="This review link is not valid, or the session is no longer available." />;
  }

  const appUrl = await getAppUrl();
  return <ReviewReport review={review} reviewUrl={`${appUrl}/review/${review.slug}/${token}`} tableHref={`/table/${review.slug}/${token}`} />;
}
