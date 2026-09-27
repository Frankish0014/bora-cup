import { EvaluationTable } from "@/components/admin/EvaluationTable";
import { FilterBar, FilterInput, FilterSelect } from "@/components/admin/FilterBar";
import { PageHeader } from "@/components/admin/PageHeader";
import { buttonClasses, buttonSm } from "@/components/ui/button";
import { getEvaluations, getFilterOptions } from "@/lib/data/admin";
import { filtersToQuery, parseEvaluationFilters } from "@/lib/filters";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EvaluationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = parseEvaluationFilters(await searchParams);
  const [result, options] = await Promise.all([getEvaluations(filters), getFilterOptions()]);
  const pages = Math.max(1, Math.ceil(result.count / result.pageSize));

  return (
    <div>
      <PageHeader
        title="Evaluations"
        description="Every saved score, as submitted. Scores use the cupping scale: OK, Good, Very Good, Excellent, Take My Money."
        action={
          <a className={buttonClasses("primary", buttonSm)} href={`/api/export/evaluations${filtersToQuery({ ...filters, page: 1 })}`}>
            Export CSV
          </a>
        }
      />
      <FilterBar resetHref="/admin/evaluations" columns={4}>
        <FilterSelect name="event" label="Event" defaultValue={filters.eventId} options={options.events.map((event) => ({ value: event.id, label: event.name }))} />
        <FilterSelect name="session" label="Session" defaultValue={filters.sessionId} options={options.sessions.map((session) => ({ value: session.id, label: session.name }))} />
        <FilterSelect name="coffee" label="Coffee" defaultValue={filters.coffeeId} options={options.coffees.map((coffee) => ({ value: coffee.id, label: coffee.lot_name }))} />
        <FilterSelect name="country" label="Country" defaultValue={filters.country} options={options.countries.map((country) => ({ value: country, label: country }))} />
        <FilterInput name="participant" label="Participant" defaultValue={filters.participant} placeholder="Name or email" />
        <FilterInput name="from" label="From" type="date" defaultValue={filters.from} />
        <FilterInput name="to" label="To" type="date" defaultValue={filters.to} />
      </FilterBar>

      <div className="mt-8 mb-3 flex items-baseline justify-between gap-3 px-1 text-sm">
        <p className="font-medium text-ink tabular">
          {result.count.toLocaleString("en-US")} {result.count === 1 ? "evaluation" : "evaluations"}
        </p>
        <p className="text-ink-mute tabular">
          Page {filters.page} of {pages}
        </p>
      </div>
      <EvaluationTable rows={result.rows} />
      {pages > 1 ? (
        <nav className="mt-4 flex items-center justify-end gap-2" aria-label="Pagination">
          {filters.page > 1 ? (
            <Link className={buttonClasses("secondary", buttonSm)} href={`/admin/evaluations${filtersToQuery(filters, { page: filters.page - 1 })}`}>
              Previous
            </Link>
          ) : null}
          {filters.page < pages ? (
            <Link className={buttonClasses("secondary", buttonSm)} href={`/admin/evaluations${filtersToQuery(filters, { page: filters.page + 1 })}`}>
              Next
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
