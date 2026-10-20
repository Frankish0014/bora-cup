import "server-only";
import { summarizeCoffees, type ScoreRow } from "@/lib/analytics";
import { cuppingScore, ratingScale } from "@/lib/ratings";
import type { CsvRow } from "@/lib/csv";
import { throwIfError } from "@/lib/errors";
import type { EvaluationFilters } from "@/lib/filters";
import { lastReachedCoffee, runProgressLabel } from "@/lib/progress";
import { resolveProvince } from "@/lib/rwanda";
import { getServiceClient } from "@/lib/supabase/admin";
import { asOne } from "@/lib/utils";
import type { CoffeeLot, EventRecord, Participant, SessionRecord } from "@/types/domain";

const PAGE_SIZE = 20;

export type EvaluationView = {
  id: string;
  aroma_score: number;
  flavor_score: number;
  overall_score: number;
  aroma_note: string | null;
  flavor_note: string | null;
  overall_note: string | null;
  total_score: number | null;
  updated_at: string;
  submitted: boolean;
  participant: {
    id: string;
    name: string;
    email: string;
    country: string;
    organization: string | null;
    role: string | null;
  };
  coffee: {
    id: string;
    lot_name: string;
    lot_number: string | null;
    cupping_code: string | null;
    washing_station: string | null;
    district: string | null;
    variety: string | null;
    process: string | null;
    altitude: string | null;
    harvest: string | null;
    display_order: number;
  };
  session: { id: string; name: string };
  event: { id: string; name: string };
};

const EVALUATION_SELECT = `
  id, aroma_score, flavor_score, overall_score, aroma_note, flavor_note, overall_note, total_score, updated_at,
  participants!inner(id, name, email, country, organization, role),
  coffee_lots!inner(id, lot_name, lot_number, cupping_code, washing_station, district, variety, process, altitude, harvest, display_order),
  sessions!inner(id, name, event_id, events!inner(id, name)),
  participant_sessions!inner(status)
`;

type ListQuery = {
  eq: (column: string, value: string) => ListQuery;
  gte: (column: string, value: string) => ListQuery;
  lte: (column: string, value: string) => ListQuery;
  or: (filters: string, options: { referencedTable: string }) => ListQuery;
  order: (column: string, options?: { ascending?: boolean }) => ListQuery;
  range: (from: number, to: number) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null; count: number | null }>;
};

function applyFilters(query: ListQuery, filters: EvaluationFilters) {
  let next: ListQuery = query;
  if (filters.sessionId) next = next.eq("session_id", filters.sessionId);
  if (filters.coffeeId) next = next.eq("coffee_lot_id", filters.coffeeId);
  if (filters.eventId) next = next.eq("sessions.event_id", filters.eventId);
  if (filters.country) next = next.eq("participants.country", filters.country);
  if (filters.participant) {
    next = next.or(`name.ilike.%${filters.participant}%,email.ilike.%${filters.participant}%`, { referencedTable: "participants" });
  }
  if (filters.from) next = next.gte("updated_at", `${filters.from}T00:00:00.000Z`);
  if (filters.to) next = next.lte("updated_at", `${filters.to}T23:59:59.999Z`);
  return next;
}

function mapEvaluation(row: Record<string, unknown>): EvaluationView {
  const participant = asOne(row.participants as EvaluationView["participant"] | EvaluationView["participant"][]);
  const coffee = asOne(row.coffee as EvaluationView["coffee"] | EvaluationView["coffee"][] | undefined) ?? asOne(row.coffee_lots as EvaluationView["coffee"] | EvaluationView["coffee"][]);
  const sessionRow = asOne(row.sessions as { id: string; name: string; events: EvaluationView["event"] | EvaluationView["event"][] } | Array<{ id: string; name: string; events: EvaluationView["event"] | EvaluationView["event"][] }>);
  const event = sessionRow ? asOne(sessionRow.events) : null;
  if (!participant || !coffee || !sessionRow || !event) {
    throw new Error("Evaluation record was incomplete.");
  }
  return {
    id: String(row.id),
    aroma_score: Number(row.aroma_score),
    flavor_score: Number(row.flavor_score),
    overall_score: Number(row.overall_score),
    aroma_note: (row.aroma_note as string | null) ?? null,
    flavor_note: (row.flavor_note as string | null) ?? null,
    overall_note: (row.overall_note as string | null) ?? null,
    total_score: row.total_score == null ? null : Number(row.total_score),
    updated_at: String(row.updated_at),
    submitted: asOne(row.participant_sessions as { status: string } | { status: string }[])?.status === "completed",
    participant,
    coffee,
    session: { id: sessionRow.id, name: sessionRow.name },
    event,
  };
}

export function evaluationToCsvRow(view: EvaluationView): CsvRow {
  return {
    "Participant Name": view.participant.name,
    Email: view.participant.email,
    Country: view.participant.country,
    Organization: view.participant.organization,
    Role: view.participant.role,
    Event: view.event.name,
    Session: view.session.name,
    "Coffee Name": view.coffee.lot_name,
    "Lot Number": view.coffee.lot_number,
    "Cupping Code": view.coffee.cupping_code,
    "Washing Station": view.coffee.washing_station,
    District: view.coffee.district,
    Variety: view.coffee.variety,
    Process: view.coffee.process,
    Altitude: view.coffee.altitude,
    Harvest: view.coffee.harvest,
    "Score / 100": cuppingScore(view.overall_score, view.total_score),
    Rating: ratingScale(view.overall_score),
    Aroma: view.aroma_note,
    Flavor: view.flavor_note,
    Overall: view.overall_note,
    "Submitted At": view.updated_at,
    Sheet: view.submitted ? "Submitted" : "In progress",
  };
}

async function fetchEvaluationBatch(filters: EvaluationFilters, from: number, to: number) {
  const supabase = getServiceClient();
  const query = applyFilters(
    supabase.from("evaluations").select(EVALUATION_SELECT, { count: "exact" }) as unknown as ListQuery,
    filters,
  )
    .order("updated_at", { ascending: false })
    .range(from, to);
  const { data, error, count } = await query;
  if (error && /total_score|schema cache/i.test(error.message)) {
    const retry = applyFilters(
      supabase.from("evaluations").select(EVALUATION_SELECT.replace(", total_score", ""), { count: "exact" }) as unknown as ListQuery,
      filters,
    )
      .order("updated_at", { ascending: false })
      .range(from, to);
    const second = await retry;
    throwIfError(second.error, "Something went wrong while loading evaluations.");
    return { rows: ((second.data ?? []) as Record<string, unknown>[]).map(mapEvaluation), count: second.count ?? 0 };
  }
  throwIfError(error, "Something went wrong while loading evaluations.");
  return { rows: ((data ?? []) as Record<string, unknown>[]).map(mapEvaluation), count: count ?? 0 };
}

export async function getEvaluations(filters: EvaluationFilters) {
  const from = (filters.page - 1) * PAGE_SIZE;
  const result = await fetchEvaluationBatch(filters, from, from + PAGE_SIZE - 1);
  return { ...result, pageSize: PAGE_SIZE };
}

export async function getEvaluationsForExport(filters: EvaluationFilters) {
  const rows: EvaluationView[] = [];
  for (let page = 0; page < 20; page += 1) {
    const from = page * 1000;
    const batch = await fetchEvaluationBatch({ ...filters, page: 1 }, from, from + 999);
    rows.push(...batch.rows);
    if (batch.rows.length < 1000) break;
  }
  return rows;
}

export async function getScoreRows(filters: EvaluationFilters) {
  const views = (await getEvaluationsForExport(filters)).filter((view) => view.submitted);
  const rows: ScoreRow[] = views.map((view) => ({
    coffeeId: view.coffee.id,
    coffeeName: view.coffee.lot_name,
    sessionName: view.session.name,
    displayOrder: view.coffee.display_order,
    score: cuppingScore(view.overall_score, view.total_score) ?? view.overall_score,
    rating: view.overall_score,
    country: view.participant.country,
    aroma: view.aroma_note,
    flavor: view.flavor_note,
    overall: view.overall_note,
  }));
  return summarizeCoffees(rows);
}

export type DashboardEvaluation = {
  session_id: string;
  coffee_lot_id: string;
  participant_id?: string;
  participant_session_id?: string;
  aroma_score: number;
  flavor_score: number;
  overall_score: number;
  aroma_note: string | null;
  flavor_note: string | null;
  overall_note: string | null;
  updated_at: string;
  total_score?: number | null;
};

export async function getDashboardStats(filters: EvaluationFilters = { page: 1 }) {
  const supabase = getServiceClient();
  const coffeeSelect = "id, lot_name, session_id, process, active, province, district, sector, cell";
  const coffeeFallback = "id, lot_name, session_id, process, active, district";
  const [participants, completed, inProgress, sessions, coffeesPrimary, recent] = await Promise.all([
    supabase.from("participants").select("id, country"),
    supabase.from("participant_sessions").select("id, session_id, status", { count: "exact" }),
    supabase.from("participant_sessions").select("*", { count: "exact", head: true }).eq("status", "in_progress"),
    supabase.from("sessions").select("id, name, slug, category, active, event_id").order("name"),
    supabase.from("coffee_lots").select(coffeeSelect).order("display_order"),
    supabase.from("participants").select("id, name, email, country, created_at").order("created_at", { ascending: false }).limit(6),
  ]);
  const failure = "Something went wrong while loading the dashboard.";
  throwIfError(participants.error, failure);
  throwIfError(completed.error, failure);
  throwIfError(inProgress.error, failure);
  throwIfError(sessions.error, failure);
  const coffees =
    coffeesPrimary.error && /province|sector|cell|schema cache/i.test(coffeesPrimary.error.message)
      ? await supabase.from("coffee_lots").select(coffeeFallback).order("display_order")
      : coffeesPrimary;
  throwIfError(coffees.error, failure);
  throwIfError(recent.error, failure);

  const recentPeople = (recent.data ?? []) as Array<Pick<Participant, "id" | "name" | "email" | "country" | "created_at">>;
  const recentProgress = await loadRunProgress(recentPeople.map((person) => person.id));

  const evaluations: DashboardEvaluation[] = [];
  const evaluationSelect = "session_id, coffee_lot_id, participant_id, participant_session_id, aroma_score, flavor_score, overall_score, aroma_note, flavor_note, overall_note, updated_at, total_score";
  const evaluationFallback = "session_id, coffee_lot_id, participant_id, participant_session_id, aroma_score, flavor_score, overall_score, aroma_note, flavor_note, overall_note, updated_at";
  for (let page = 0; page < 20; page += 1) {
    const from = page * 1000;
    const first = await supabase.from("evaluations").select(evaluationSelect).order("updated_at", { ascending: true }).range(from, from + 999);
    const usedFallback = Boolean(first.error && /total_score|schema cache/i.test(first.error.message));
    const evaluationPage = usedFallback
      ? await supabase.from("evaluations").select(evaluationFallback).order("updated_at", { ascending: true }).range(from, from + 999)
      : first;
    throwIfError(evaluationPage.error, failure);
    evaluations.push(...((evaluationPage.data ?? []) as DashboardEvaluation[]));
    if ((evaluationPage.data ?? []).length < 1000) break;
  }

  const people = (participants.data ?? []) as Array<{ id: string; country: string }>;
  const countryByParticipant = new Map(people.map((person) => [person.id, person.country]));
  const sessionRows = (sessions.data ?? []) as Array<{ id: string; name: string; slug: string; category: string; active: boolean; event_id?: string }>;
  const lotRows = (coffees.data ?? []) as Array<{
    id: string;
    lot_name: string;
    session_id: string;
    process: string | null;
    active: boolean;
    province?: string | null;
    district?: string | null;
    sector?: string | null;
    cell?: string | null;
  }>;
  const lotById = new Map(lotRows.map((lot) => [lot.id, lot]));
  const eventSessionIds = new Set(filters.eventId ? sessionRows.filter((session) => session.event_id === filters.eventId).map((session) => session.id) : sessionRows.map((session) => session.id));

  const visible = evaluations.filter((evaluation) => {
    if (!eventSessionIds.has(evaluation.session_id)) return false;
    if (filters.sessionId && evaluation.session_id !== filters.sessionId) return false;
    if (filters.coffeeId && evaluation.coffee_lot_id !== filters.coffeeId) return false;
    if (filters.country && countryByParticipant.get(evaluation.participant_id ?? "") !== filters.country) return false;
    const lot = lotById.get(evaluation.coffee_lot_id);
    const province = resolveProvince(lot ?? {});
    if (filters.province && province !== filters.province) return false;
    if (filters.district && (lot?.district ?? "") !== filters.district) return false;
    if (filters.sector && (lot?.sector ?? "") !== filters.sector) return false;
    if (filters.cell && (lot?.cell ?? "") !== filters.cell) return false;
    return true;
  });

  const runs = (completed.data ?? []) as Array<{ id: string; session_id: string; status: string }>;
  const visibleRuns = runs.filter((run) => eventSessionIds.has(run.session_id) && (!filters.sessionId || run.session_id === filters.sessionId));
  const completedRunIds = new Set(visibleRuns.filter((run) => run.status === "completed").map((run) => run.id));
  const scoredRunIds = new Set(visible.map((evaluation) => evaluation.participant_session_id).filter(Boolean));
  const official = visible.filter((evaluation) => evaluation.participant_session_id && completedRunIds.has(evaluation.participant_session_id));
  const counts = new Map<string, number>();
  for (const evaluation of official) counts.set(evaluation.session_id, (counts.get(evaluation.session_id) ?? 0) + 1);
  const uniqueParticipants = new Set(official.map((evaluation) => evaluation.participant_id).filter(Boolean));

  return {
    participants: uniqueParticipants.size,
    completedSessions: visibleRuns.filter((run) => run.status === "completed").length,
    inProgressSessions: visibleRuns.filter((run) => run.status === "in_progress" && scoredRunIds.has(run.id)).length,
    evaluations: official,
    sessions: sessionRows.filter((session) => eventSessionIds.has(session.id)).map((session) => ({
      ...session,
      evaluations: counts.get(session.id) ?? 0,
    })),
    coffees: lotRows,
    recent: recentPeople.map((person) => ({
      ...person,
      progress: recentProgress.get(person.id) ?? "No session yet",
    })),
    countries: people.map((person) => person.country),
  };
}

async function loadRunProgress(participantIds: string[]) {
  const progress = new Map<string, string>();
  if (participantIds.length === 0) return progress;
  const supabase = getServiceClient();
  const { data: runs, error: runError } = await supabase
    .from("participant_sessions")
    .select("id, participant_id, session_id, status, started_at, sessions(name)")
    .in("participant_id", participantIds)
    .order("started_at", { ascending: false });
  throwIfError(runError, "Something went wrong while loading participants.");
  const runRows = (runs ?? []) as Array<{
    id: string;
    participant_id: string;
    session_id: string;
    status: string;
    started_at: string;
    sessions: { name: string } | { name: string }[] | null;
  }>;
  if (runRows.length === 0) return progress;

  const sessionIds = [...new Set(runRows.map((run) => run.session_id))];
  const [{ data: lots, error: lotError }, { data: evaluations, error: evaluationError }] = await Promise.all([
    supabase.from("coffee_lots").select("id, lot_name, display_order, session_id").eq("active", true).in("session_id", sessionIds),
    supabase.from("evaluations").select("participant_session_id, coffee_lot_id").in(
      "participant_session_id",
      runRows.map((run) => run.id),
    ),
  ]);
  throwIfError(lotError, "Something went wrong while loading participants.");
  throwIfError(evaluationError, "Something went wrong while loading participants.");

  const coffees = (lots ?? []) as Array<{ id: string; lot_name: string; display_order: number; session_id: string }>;
  const ratedByRun = new Map<string, string[]>();
  for (const evaluation of evaluations ?? []) {
    const runId = evaluation.participant_session_id as string;
    const list = ratedByRun.get(runId) ?? [];
    list.push(evaluation.coffee_lot_id as string);
    ratedByRun.set(runId, list);
  }

  const picked = new Map<string, (typeof runRows)[number]>();
  for (const run of runRows) {
    const current = picked.get(run.participant_id);
    if (!current || (current.status === "completed" && run.status === "in_progress")) {
      picked.set(run.participant_id, run);
    }
  }

  for (const [participantId, run] of picked) {
    const sessionCoffees = coffees.filter((coffee) => coffee.session_id === run.session_id);
    const ratedIds = ratedByRun.get(run.id) ?? [];
    const last = lastReachedCoffee(ratedIds, sessionCoffees);
    const sessionName = asOne(run.sessions)?.name ?? "Session";
    progress.set(
      participantId,
      `${sessionName} · ${runProgressLabel({
        status: run.status,
        rated: ratedIds.length,
        total: sessionCoffees.length,
        lastCoffee: last?.lot_name ?? null,
      })}`,
    );
  }
  return progress;
}

export async function getEvents() {
  const supabase = getServiceClient();
  const { data, error } = await supabase.from("events").select("*").order("start_date", { ascending: false, nullsFirst: false }).order("name");
  throwIfError(error, "Something went wrong while loading events.");
  return (data ?? []) as EventRecord[];
}

export async function getEvent(id: string) {
  const supabase = getServiceClient();
  const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  throwIfError(error, "Something went wrong while loading this event.");
  return (data as EventRecord | null) ?? null;
}

export async function getSessions() {
  const supabase = getServiceClient();
  const { data, error } = await supabase.from("sessions").select("*, events(name)").order("name");
  throwIfError(error, "Something went wrong while loading sessions.");
  return (data ?? []).map((session) => {
    const { events, ...rest } = session;
    const record = rest as SessionRecord;
    return {
      ...record,
      joining_open: record.joining_open !== false,
      eventName: asOne(events as { name: string } | { name: string }[])?.name ?? "—",
    };
  });
}

export async function getSession(id: string) {
  const supabase = getServiceClient();
  const { data, error } = await supabase.from("sessions").select("*").eq("id", id).maybeSingle();
  throwIfError(error, "Something went wrong while loading this session.");
  if (!data) return null;
  return { ...(data as SessionRecord), joining_open: data.joining_open !== false };
}

export type SessionCupper = {
  runId: string;
  participantId: string;
  name: string;
  email: string;
  country: string;
  status: "in_progress" | "completed";
  startedAt: string;
  completedAt: string | null;
  cupsRated: number;
};

export async function getSessionCuppers(sessionId: string) {
  const supabase = getServiceClient();
  const { data: runs, error } = await supabase
    .from("participant_sessions")
    .select("id, status, started_at, completed_at, participant_id, participants(id, name, email, country)")
    .eq("session_id", sessionId)
    .order("started_at", { ascending: true });
  throwIfError(error, "Something went wrong while loading this table.");
  const runIds = (runs ?? []).map((run) => run.id as string);
  const counts = new Map<string, number>();
  if (runIds.length > 0) {
    const { data: evaluations, error: evaluationError } = await supabase
      .from("evaluations")
      .select("participant_session_id")
      .eq("session_id", sessionId)
      .in("participant_session_id", runIds);
    throwIfError(evaluationError, "Something went wrong while loading this table.");
    for (const evaluation of evaluations ?? []) {
      const runId = evaluation.participant_session_id as string;
      counts.set(runId, (counts.get(runId) ?? 0) + 1);
    }
  }
  return (runs ?? []).flatMap((run) => {
    const person = asOne(
      run.participants as
        | { id: string; name: string; email: string; country: string }
        | Array<{ id: string; name: string; email: string; country: string }>
        | null,
    );
    if (!person) return [];
    return [
      {
        runId: run.id as string,
        participantId: person.id,
        name: person.name,
        email: person.email,
        country: person.country,
        status: run.status === "completed" ? "completed" : "in_progress",
        startedAt: run.started_at as string,
        completedAt: (run.completed_at as string | null) ?? null,
        cupsRated: counts.get(run.id as string) ?? 0,
      } satisfies SessionCupper,
    ];
  });
}

export async function getCoffees(sessionId?: string) {
  const supabase = getServiceClient();
  let query = supabase.from("coffee_lots").select("*, sessions(name, slug)").order("display_order").order("lot_name");
  if (sessionId) query = query.eq("session_id", sessionId);
  const { data, error } = await query;
  throwIfError(error, "Something went wrong while loading coffee lots.");
  return (data ?? []).map((coffee) => {
    const { sessions, ...rest } = coffee;
    const session = asOne(sessions as { name: string; slug: string } | { name: string; slug: string }[]);
    return { ...(rest as CoffeeLot), sessionName: session?.name ?? "—", sessionSlug: session?.slug ?? "" };
  });
}

export async function getCoffee(id: string) {
  const supabase = getServiceClient();
  const { data, error } = await supabase.from("coffee_lots").select("*").eq("id", id).maybeSingle();
  throwIfError(error, "Something went wrong while loading this coffee.");
  return (data as CoffeeLot | null) ?? null;
}

export async function getParticipants(search?: string) {
  const supabase = getServiceClient();
  let query = supabase.from("participants").select("*").order("created_at", { ascending: false }).limit(200);
  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  const { data, error } = await query;
  throwIfError(error, "Something went wrong while loading participants.");
  const participants = (data ?? []) as Participant[];
  if (participants.length === 0) return [];

  const progress = await loadRunProgress(participants.map((participant) => participant.id));

  return participants.map((participant) => ({
    ...participant,
    sessions: progress.get(participant.id) ? [progress.get(participant.id) as string] : [],
  }));
}

export async function getParticipantDetail(id: string) {
  const supabase = getServiceClient();
  const { data, error } = await supabase.from("participants").select("*").eq("id", id).maybeSingle();
  throwIfError(error, "Something went wrong while loading this participant.");
  if (!data) return null;
  const { data: runs, error: runError } = await supabase
    .from("participant_sessions")
    .select("id, session_id, status, started_at, completed_at, sessions(name, slug)")
    .eq("participant_id", id)
    .order("started_at", { ascending: false });
  throwIfError(runError, "Something went wrong while loading this participant.");
  const { data: evaluations, error: evaluationError } = await supabase
    .from("evaluations")
    .select("id, participant_session_id, coffee_lot_id, aroma_score, flavor_score, overall_score, aroma_note, flavor_note, overall_note, updated_at, coffee_lots(lot_name), sessions(name)")
    .eq("participant_id", id)
    .order("updated_at", { ascending: false });
  throwIfError(evaluationError, "Something went wrong while loading this participant.");
  const sessionIds = [...new Set((runs ?? []).map((run) => run.session_id as string))];
  const { data: lots, error: lotError } =
    sessionIds.length > 0
      ? await supabase.from("coffee_lots").select("id, lot_name, display_order, session_id").eq("active", true).in("session_id", sessionIds)
      : { data: [], error: null };
  throwIfError(lotError, "Something went wrong while loading this participant.");
  const coffees = (lots ?? []) as Array<{ id: string; lot_name: string; display_order: number; session_id: string }>;
  const ratedByRun = new Map<string, string[]>();
  for (const evaluation of evaluations ?? []) {
    const runId = evaluation.participant_session_id as string;
    const list = ratedByRun.get(runId) ?? [];
    list.push(evaluation.coffee_lot_id as string);
    ratedByRun.set(runId, list);
  }
  return {
    participant: data as Participant,
    runs: (runs ?? []).map((run) => {
      const sessionCoffees = coffees.filter((coffee) => coffee.session_id === run.session_id);
      const ratedIds = ratedByRun.get(run.id as string) ?? [];
      const last = lastReachedCoffee(ratedIds, sessionCoffees);
      return {
        id: run.id as string,
        status: run.status as string,
        started_at: run.started_at as string,
        completed_at: run.completed_at as string | null,
        sessionName: asOne(run.sessions as { name: string } | { name: string }[])?.name ?? "Session",
        progress: runProgressLabel({
          status: run.status as string,
          rated: ratedIds.length,
          total: sessionCoffees.length,
          lastCoffee: last?.lot_name ?? null,
        }),
      };
    }),
    evaluations: (evaluations ?? []).map((evaluation) => ({
      id: evaluation.id as string,
      aroma_score: evaluation.aroma_score as number,
      flavor_score: evaluation.flavor_score as number,
      overall_score: evaluation.overall_score as number,
      aroma_note: evaluation.aroma_note as string | null,
      flavor_note: evaluation.flavor_note as string | null,
      overall_note: evaluation.overall_note as string | null,
      updated_at: evaluation.updated_at as string,
      coffeeName: asOne(evaluation.coffee_lots as { lot_name: string } | { lot_name: string }[])?.lot_name ?? "Coffee",
      sessionName: asOne(evaluation.sessions as { name: string } | { name: string }[])?.name ?? "Session",
    })),
  };
}

export async function getFilterOptions() {
  const [events, sessions, coffees, participants] = await Promise.all([getEvents(), getSessions(), getCoffees(), getParticipants()]);
  const countries = [...new Set(participants.map((participant) => participant.country))].sort((a, b) => a.localeCompare(b));
  return { events, sessions, coffees, countries };
}

export async function getNextDisplayOrder(sessionId: string) {
  const coffees = await getCoffees(sessionId);
  return coffees.reduce((max, coffee) => Math.max(max, coffee.display_order), 0) + 1;
}
