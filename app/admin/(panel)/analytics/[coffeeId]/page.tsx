import { CommentsList } from "@/components/admin/CommentsList";
import { BackLink, PageHeader, SectionTitle } from "@/components/admin/PageHeader";
import { ScoreDistribution } from "@/components/admin/ScoreDistribution";
import { getCoffee, getScoreRows } from "@/lib/data/admin";
import { parseEvaluationFilters } from "@/lib/filters";
import { formatAverage } from "@/lib/ratings";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CoffeeAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ coffeeId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { coffeeId } = await params;
  const filters = parseEvaluationFilters({ ...(await searchParams), coffee: coffeeId });
  const [summary] = await getScoreRows(filters);
  if (!summary) {
    const coffee = await getCoffee(coffeeId);
    if (!coffee) notFound();
    return (
      <div>
        <PageHeader eyebrow={<BackLink href="/admin/analytics">All analytics</BackLink>} title={coffee.lot_name} description="No evaluations match these filters." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow={<BackLink href="/admin/analytics">All analytics</BackLink>}
        title={summary.coffeeName}
        description={`${summary.sessionName} · ${summary.evaluations} ${summary.evaluations === 1 ? "evaluation" : "evaluations"}`}
      />
      <dl className="grid gap-3 sm:max-w-xs">
        <Score label="Rating" value={summary.score} />
      </dl>
      <div className="mt-10">
        <SectionTitle description="How many participants chose each score.">Distribution</SectionTitle>
        <div className="max-w-xl">
          <ScoreDistribution title="Rating" counts={summary.scoreDistribution} />
        </div>
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <section>
          <SectionTitle>Countries</SectionTitle>
          <ul className="card divide-y divide-line">
            {summary.countries.map((country) => (
              <li key={country.label} className="flex items-baseline justify-between gap-3 px-4 py-3 text-sm">
                <span className="text-ink">{country.label}</span>
                <span className="text-ink-soft tabular">{country.count}</span>
              </li>
            ))}
            {summary.countries.length === 0 ? <li className="px-4 py-8 text-center text-sm text-ink-soft">No country data.</li> : null}
          </ul>
        </section>
        <CommentsList coffeeName={summary.coffeeName} comments={summary.comments} />
      </div>
    </div>
  );
}

function Score({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="card p-5">
      <dt className="text-sm text-ink-soft">{label}</dt>
      <dd className="mt-2 font-display text-4xl leading-none text-ink tabular">
        {formatAverage(value)} <span className="text-lg text-ink-mute">/ 100</span>
      </dd>
    </div>
  );
}
