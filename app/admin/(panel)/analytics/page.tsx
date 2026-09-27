import { AnalyticsCard } from "@/components/admin/AnalyticsCard";
import { FilterBar, FilterInput, FilterSelect } from "@/components/admin/FilterBar";
import { PageHeader } from "@/components/admin/PageHeader";
import { getFilterOptions, getScoreRows } from "@/lib/data/admin";
import { filtersToQuery, parseEvaluationFilters } from "@/lib/filters";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = parseEvaluationFilters(await searchParams);
  const [summaries, options] = await Promise.all([getScoreRows(filters), getFilterOptions()]);

  return (
    <div>
      <PageHeader title="Analytics" description="Averages out of 100. They describe the feedback; they do not rank a winner." />
      <FilterBar resetHref="/admin/analytics" columns={4}>
        <FilterSelect name="event" label="Event" defaultValue={filters.eventId} options={options.events.map((event) => ({ value: event.id, label: event.name }))} />
        <FilterSelect name="session" label="Session" defaultValue={filters.sessionId} options={options.sessions.map((session) => ({ value: session.id, label: session.name }))} />
        <FilterInput name="from" label="From" type="date" defaultValue={filters.from} />
        <FilterInput name="to" label="To" type="date" defaultValue={filters.to} />
      </FilterBar>
      <p className="mt-8 mb-3 px-1 text-sm font-medium text-ink tabular">
        {summaries.length} {summaries.length === 1 ? "coffee" : "coffees"}
      </p>
      <ul className="space-y-3">
        {summaries.map((summary) => (
          <AnalyticsCard
            key={summary.coffeeId}
            href={`/admin/analytics/${summary.coffeeId}${filtersToQuery(filters, { coffeeId: undefined, page: 1 })}`}
            title={summary.coffeeName}
            sessionName={summary.sessionName}
            evaluations={summary.evaluations}
            score={summary.score}
          />
        ))}
      </ul>
      {summaries.length === 0 ? <p className="card px-5 py-12 text-center text-sm text-ink-soft">No evaluations match these filters.</p> : null}
    </div>
  );
}
