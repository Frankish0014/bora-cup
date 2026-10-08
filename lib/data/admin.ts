import "server-only";
import { summarizeCoffees, type ScoreRow } from "@/lib/analytics";
import { ratingScale, scoreOutOf100 } from "@/lib/ratings";
import type { CsvRow } from "@/lib/csv";
import { throwIfError } from "@/lib/errors";
import type { EvaluationFilters } from "@/lib/filters";
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
  updated_at: string;
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
  id, aroma_score, flavor_score, overall_score, aroma_note, flavor_note, overall_note, updated_at,
  participants!inner(id, name, email, country, organization, role),
  coffee_lots!inner(id, lot_name, lot_number, cupping_code, washing_station, district, variety, process, altitude, harvest, display_order),
  sessions!inner(id, name, event_id, events!inner(id, name))
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
    updated_at: String(row.updated_at),
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
    "Score / 100": scoreOutOf100(view.overall_score),
    Rating: ratingScale(view.overall_score),
    Aroma: view.aroma_note,
    Flavor: view.flavor_note,
    Overall: view.overall_note,
    "Submitted At": view.updated_at,
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
  const views = await getEvaluationsForExport(filters);
  const rows: ScoreRow[] = views.map((view) => ({
    coffeeId: view.coffee.id,
    coffeeName: view.coffee.lot_name,
    sessionName: view.session.name,
    displayOrder: view.coffee.display_order,
    score: view.overall_score,
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
  aroma_score: number;
  flavor_score: number;
  overall_score: number;
  aroma_note: string | null;
  flavor_note: string | null;
  overall_note: string | null;
  updated_at: string;
};

export async function getDashboardStats() {
  const supabase = getServiceClient();
  const [participants, completed, inProgress, sessions, coffees, recent] = await Promise.all([
    supabase.from("participants").select("*", { count: "exact", head: true }),
    supabase.from("participant_sessions").select("*", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("participant_sessions").select("*", { count: "exact", head: true }).eq("status", "in_progress"),
    supabase.from("sessions").select("id, name, slug, category, active").order("name"),
    supabase.from("coffee_lots").select("id, lot_name, session_id, process, active").order("display_order"),
    supabase.from("participants").select("id, name, email, country, created_at").order("created_at", { ascending: false }).limit(6),
  ]);
  const failure = "Something went wrong while loading the dashboard.";
  throwIfError(participants.error, failure);
  throwIfError(completed.error, failure);
  throwIfError(inProgress.error, failure);
  throwIfError(sessions.error, failure);
  throwIfError(coffees.error, failure);
  throwIfError(recent.error, failure);

  const evaluations: DashboardEvaluation[] = [];
  const countries: string[] = [];
  for (let page = 0; page < 20; page += 1) {
    const from = page * 1000;
    const [{ data: evaluationPage, error: evaluationError }, { data: countryPage, error: countryError }] = await Promise.all([
      supabase
        .from("evaluations")
        .select("session_id, coffee_lot_id, aroma_score, flavor_score, overall_score, aroma_note, flavor_note, overall_note, updated_at")
        .order("updated_at", { ascending: true })
        .range(from, from + 999),
      page === 0 ? supabase.from("participants").select("country").range(0, 999) : Promise.resolve({ data: [], error: null }),
    ]);
    throwIfError(evaluationError, failure);
    throwIfError(countryError, failure);
    evaluations.push(...((evaluationPage ?? []) as DashboardEvaluation[]));
    if (page === 0) countries.push(...((countryPage ?? []).map((row) => row.country as string)));
    if ((evaluationPage ?? []).length < 1000) break;
  }

  const counts = new Map<string, number>();
  for (const evaluation of evaluations) counts.set(evaluation.session_id, (counts.get(evaluation.session_id) ?? 0) + 1);

  return {
    participants: participants.count ?? 0,
    completedSessions: completed.count ?? 0,
    inProgressSessions: inProgress.count ?? 0,
    evaluations,
    sessions: ((sessions.data ?? []) as Array<{ id: string; name: string; slug: string; category: string; active: boolean }>).map((session) => ({
      ...session,
      evaluations: counts.get(session.id) ?? 0,
    })),
    coffees: (coffees.data ?? []) as Array<{ id: string; lot_name: string; session_id: string; process: string | null; active: boolean }>,
    recent: (recent.data ?? []) as Array<Pick<Participant, "id" | "name" | "email" | "country" | "created_at">>,
    countries,
  };
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
    return { ...(rest as SessionRecord), eventName: asOne(events as { name: string } | { name: string }[])?.name ?? "—" };
  });
}

export async function getSession(id: string) {
  const supabase = getServiceClient();
  const { data, error } = await supabase.from("sessions").select("*").eq("id", id).maybeSingle();
  throwIfError(error, "Something went wrong while loading this session.");
  return (data as SessionRecord | null) ?? null;
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

  const { data: runs, error: runError } = await supabase
    .from("participant_sessions")
    .select("participant_id, status, sessions(name)")
    .in("participant_id", participants.map((participant) => participant.id));
  throwIfError(runError, "Something went wrong while loading participants.");

  const grouped = new Map<string, string[]>();
  for (const run of runs ?? []) {
    const session = asOne(run.sessions as { name: string } | { name: string }[]);
    const label = session ? `${session.name}${run.status === "completed" ? "" : " (in progress)"}` : "Session";
    const list = grouped.get(run.participant_id as string) ?? [];
    list.push(label);
    grouped.set(run.participant_id as string, list);
  }

  return participants.map((participant) => ({ ...participant, sessions: grouped.get(participant.id) ?? [] }));
}

export async function getParticipantDetail(id: string) {
  const supabase = getServiceClient();
  const { data, error } = await supabase.from("participants").select("*").eq("id", id).maybeSingle();
  throwIfError(error, "Something went wrong while loading this participant.");
  if (!data) return null;
  const { data: runs, error: runError } = await supabase
    .from("participant_sessions")
    .select("id, status, started_at, completed_at, sessions(name, slug)")
    .eq("participant_id", id)
    .order("started_at", { ascending: false });
  throwIfError(runError, "Something went wrong while loading this participant.");
  const { data: evaluations, error: evaluationError } = await supabase
    .from("evaluations")
    .select("id, aroma_score, flavor_score, overall_score, aroma_note, flavor_note, overall_note, updated_at, coffee_lots(lot_name), sessions(name)")
    .eq("participant_id", id)
    .order("updated_at", { ascending: false });
  throwIfError(evaluationError, "Something went wrong while loading this participant.");
  return {
    participant: data as Participant,
    runs: (runs ?? []).map((run) => ({
      id: run.id as string,
      status: run.status as string,
      started_at: run.started_at as string,
      completed_at: run.completed_at as string | null,
      sessionName: asOne(run.sessions as { name: string } | { name: string }[])?.name ?? "Session",
    })),
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
