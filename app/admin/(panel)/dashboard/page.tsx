import { ChartCard, ChartEmpty, DonutChart, HorizontalBars, Kpi, RATING_COLORS, SERIES_COLORS, VerticalBars } from "@/components/admin/charts";
import { PageHeader, SectionAction, SectionTitle } from "@/components/admin/PageHeader";
import { buttonClasses, buttonSm } from "@/components/ui/button";
import { average, countBy, distribution } from "@/lib/analytics";
import { getDashboardStats, type DashboardEvaluation } from "@/lib/data/admin";
import { RATING_OPTIONS, formatAverage, scoreOutOf100 } from "@/lib/ratings";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const { evaluations } = stats;
  const activeCoffees = stats.coffees.filter((coffee) => coffee.active);
  const openSessions = stats.sessions.filter((session) => session.active);
  const cuppingStarted = stats.participants > 0 || evaluations.length > 0;

  if (!cuppingStarted) {
    return (
      <div>
        <PageHeader
          title="Best of Rwanda Cup Tour"
          description="The table is ready for official cupping. Scores will appear here as cuppers save."
          action={
            <>
              <Link href="/admin/qr-codes" className={buttonClasses("secondary", buttonSm)}>
                QR codes
              </Link>
              <Link href="/admin/sessions" className={buttonClasses("primary", buttonSm)}>
                Sessions
              </Link>
            </>
          }
        />
        <div className="card p-5 sm:p-7">
          <p className="text-[15px] font-semibold text-ink">No ratings yet</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink-soft">Practice and demo cuppings have been cleared. Open sessions stay available for international cuppers.</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {openSessions.map((session) => {
              const lots = activeCoffees.filter((coffee) => coffee.session_id === session.id).length;
              return (
                <li key={session.id} className="rounded-2xl border border-line bg-paper px-4 py-4">
                  <p className="font-medium text-ink">{session.name}</p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {session.category} · {lots} {lots === 1 ? "coffee" : "coffees"}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }

  const overallAverage = average(evaluations.map((row) => row.overall_score));
  const overallDistribution = distribution(evaluations.map((row) => row.overall_score));
  const aromaNotes = evaluations.filter((row) => row.aroma_note?.trim()).length;
  const flavorNotes = evaluations.filter((row) => row.flavor_note?.trim()).length;
  const overallNotes = evaluations.filter((row) => row.overall_note?.trim()).length;
  const withNotes = evaluations.filter((row) => row.aroma_note?.trim() || row.flavor_note?.trim() || row.overall_note?.trim()).length;
  const cuppedCoffees = new Set(evaluations.map((row) => row.coffee_lot_id)).size;
  const countries = countBy(stats.countries);
  const sessionRuns = stats.completedSessions + stats.inProgressSessions;

  const coffeeName = new Map(stats.coffees.map((coffee) => [coffee.id, coffee.lot_name]));
  const sessionName = new Map(stats.sessions.map((session) => [session.id, session.name]));
  const byCoffee = new Map<string, number[]>();
  for (const row of evaluations) {
    const list = byCoffee.get(row.coffee_lot_id) ?? [];
    list.push(row.overall_score);
    byCoffee.set(row.coffee_lot_id, list);
  }
  const topCoffees = [...byCoffee.entries()]
    .map(([id, scores]) => ({ id, label: coffeeName.get(id) ?? "Unknown coffee", value: average(scores) ?? 0, count: scores.length }))
    .sort((a, b) => b.value - a.value || b.count - a.count)
    .slice(0, 8);

  const processes = groupTail(countBy(activeCoffees.map((coffee) => coffee.process?.trim() || "Not specified")), 5);
  const timeline = bucketByTime(evaluations);

  return (
    <div>
      <PageHeader
        title="Best of Rwanda Cup Tour"
        description="Live picture of the single rating and the aroma, flavor, and overall notes."
        action={
          <>
            <Link href="/admin/qr-codes" className={buttonClasses("secondary", buttonSm)}>
              QR codes
            </Link>
            <a href="/api/export/evaluations" className={buttonClasses("secondary", buttonSm)}>
              Export CSV
            </a>
            <Link href="/admin/analytics" className={buttonClasses("primary", buttonSm)}>
              Full analytics
            </Link>
          </>
        }
      />

      <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Kpi label="Participants" value={stats.participants.toLocaleString("en-US")} hint={`${countries.length} ${countries.length === 1 ? "country" : "countries"}`} accent />
        <Kpi label="Evaluations" value={evaluations.length.toLocaleString("en-US")} hint={`${withNotes} with notes`} />
        <Kpi label="Avg rating" value={formatAverage(overallAverage)} hint="out of 100" />
        <Kpi label="Completed" value={stats.completedSessions.toLocaleString("en-US")} hint="cupping sessions" />
        <Kpi label="In progress" value={stats.inProgressSessions.toLocaleString("en-US")} hint="cupping sessions" />
        <Kpi label="Coffees rated" value={`${cuppedCoffees}/${activeCoffees.length}`} hint="have at least one rating" />
      </dl>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
        <ChartCard title="Ratings" description="One score per coffee, from OK to Take My Money.">
          {evaluations.length === 0 ? (
            <ChartEmpty />
          ) : (
            <DonutChart
              centerLabel="avg rating"
              centerValue={formatAverage(overallAverage)}
              slices={[...RATING_OPTIONS].reverse().map((option) => ({
                label: `${option.score} ${option.label}`,
                value: overallDistribution[option.score],
                color: RATING_COLORS[option.score],
              }))}
            />
          )}
        </ChartCard>

        <ChartCard title="Notes" description="Aroma, flavor, and overall are written notes beside the rating.">
          {evaluations.length === 0 ? (
            <ChartEmpty />
          ) : (
            <HorizontalBars
              rows={[
                { label: "Aroma", hint: "tastings with an aroma note", value: aromaNotes },
                { label: "Flavor", hint: "tastings with a flavor note", value: flavorNotes },
                { label: "Overall", hint: "tastings with an overall note", value: overallNotes },
              ]}
              max={Math.max(evaluations.length, 1)}
              color={SERIES_COLORS[2]}
            />
          )}
        </ChartCard>

        <ChartCard title="Session completion" description="Participant sessions started versus finished.">
          {sessionRuns === 0 ? (
            <ChartEmpty />
          ) : (
            <DonutChart
              centerLabel="completed"
              centerValue={`${Math.round((stats.completedSessions / sessionRuns) * 100)}%`}
              slices={[
                { label: "Completed", value: stats.completedSessions, color: SERIES_COLORS[1] },
                { label: "In progress", value: stats.inProgressSessions, color: SERIES_COLORS[5] },
              ]}
            />
          )}
        </ChartCard>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
        <ChartCard title="Evaluations by session" description="Saved ratings per cupping session.">
          <HorizontalBars rows={stats.sessions.map((session) => ({ label: session.name, hint: session.category, value: session.evaluations }))} />
        </ChartCard>

        <ChartCard title="Participants by country" description="Top countries by number of participants.">
          <HorizontalBars rows={countries.slice(0, 8).map((country) => ({ label: country.label, value: country.count }))} color={SERIES_COLORS[1]} />
        </ChartCard>

        <ChartCard title="Evaluations over time" description={timeline.unit === "hour" ? "Ratings saved per hour." : "Ratings saved per day."}>
          <VerticalBars points={timeline.points} />
        </ChartCard>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-5 [&>*]:min-w-0">
        <ChartCard title="Coffees by process" description="Processing methods across active lots." className="lg:col-span-2">
          {activeCoffees.length === 0 ? (
            <ChartEmpty />
          ) : (
            <DonutChart
              centerLabel="coffee lots"
              centerValue={String(activeCoffees.length)}
              slices={processes.map((process, index) => ({ label: process.label, value: process.count, color: SERIES_COLORS[index % SERIES_COLORS.length] }))}
            />
          )}
        </ChartCard>

        <ChartCard
          className="lg:col-span-3"
          title="Highest average rating"
          description="Averages describe feedback; they are not a public ranking."
          aside={
            <Link href="/admin/analytics" className={buttonClasses("secondary", "min-h-8 rounded-md px-2.5 text-[13px]")}>
              All coffees
            </Link>
          }
        >
          <HorizontalBars
            rows={topCoffees.map((coffee) => ({ label: coffee.label, hint: `${coffee.count} ${coffee.count === 1 ? "score" : "scores"}`, value: scoreOutOf100(coffee.value) ?? 0 }))}
            max={100}
            format={(value) => value.toFixed(1)}
            color={SERIES_COLORS[1]}
          />
        </ChartCard>
      </div>

      <section className="mt-10">
        <SectionTitle action={<SectionAction href="/admin/participants">All participants</SectionAction>}>Recent participants</SectionTitle>
        <ul className="card divide-y divide-line">
          {stats.recent.map((participant) => (
            <li key={participant.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-[15px] sm:px-5">
              <span className="min-w-0">
                <span className="font-medium text-ink">{participant.name}</span>
                <span className="ml-2 text-ink-mute">{participant.country}</span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="hidden text-xs text-ink-mute tabular sm:inline">{formatDateTime(participant.created_at)}</span>
                <Link href={`/admin/participants/${participant.id}`} className={buttonClasses("secondary", "min-h-8 rounded-md px-2.5 text-[13px]")}>
                  View
                </Link>
              </span>
            </li>
          ))}
          {stats.recent.length === 0 ? <li className="px-5 py-10 text-center text-sm text-ink-soft">No participants yet.</li> : null}
        </ul>
      </section>

      {stats.sessions.some((session) => session.evaluations === 0) ? (
        <p className="mt-4 px-1 text-xs text-ink-mute">
          Sessions without scores yet: {stats.sessions.filter((session) => session.evaluations === 0).map((session) => sessionName.get(session.id)).join(", ")}.
        </p>
      ) : null}
    </div>
  );
}

function groupTail(rows: Array<{ label: string; count: number }>, keep: number) {
  if (rows.length <= keep + 1) return rows;
  const head = rows.slice(0, keep);
  const other = rows.slice(keep).reduce((sum, row) => sum + row.count, 0);
  return [...head, { label: `Other (${rows.length - keep})`, count: other }];
}

function bucketByTime(evaluations: DashboardEvaluation[]) {
  const days = new Set(evaluations.map((row) => row.updated_at.slice(0, 10)));
  const unit: "hour" | "day" = days.size <= 1 ? "hour" : "day";
  const buckets = new Map<string, { order: number; label: string; value: number }>();
  for (const row of evaluations) {
    const date = new Date(row.updated_at);
    if (Number.isNaN(date.getTime())) continue;
    const key = unit === "hour" ? `${row.updated_at.slice(0, 13)}` : row.updated_at.slice(0, 10);
    const label =
      unit === "hour"
        ? new Intl.DateTimeFormat("en", { hour: "numeric" }).format(date)
        : new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(date);
    const bucket = buckets.get(key) ?? { order: date.getTime(), label, value: 0 };
    bucket.value += 1;
    buckets.set(key, bucket);
  }
  const points = [...buckets.values()]
    .sort((a, b) => a.order - b.order)
    .slice(-14)
    .map((bucket) => ({ label: bucket.label, value: bucket.value }));
  return { unit, points };
}
