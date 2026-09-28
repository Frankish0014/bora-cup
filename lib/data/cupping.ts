import "server-only";
import { cookies } from "next/headers";
import { throwIfError } from "@/lib/errors";
import { parseResumeTokens, RESUME_COOKIE } from "@/lib/resume";
import { getServiceClient } from "@/lib/supabase/admin";
import { asOne, isSlug } from "@/lib/utils";
import type { CoffeeLot, EventRecord, ParticipantSession, SessionRecord } from "@/types/domain";

export type SessionWithEvent = SessionRecord & { event: EventRecord | null };

export async function getSessionBySlug(slug: string) {
  if (!isSlug(slug)) return null;
  const supabase = getServiceClient();
  const { data, error } = await supabase.from("sessions").select("*, events(*)").eq("slug", slug).maybeSingle();
  throwIfError(error, "Something went wrong while loading this session.");
  if (!data) return null;
  const event = asOne(data.events as EventRecord | EventRecord[] | null);
  return {
    id: data.id as string,
    event_id: data.event_id as string,
    name: data.name as string,
    category: data.category as string,
    slug: data.slug as string,
    description: (data.description as string | null) ?? null,
    active: Boolean(data.active),
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
    event,
  } satisfies SessionWithEvent;
}

export async function getActiveSessions() {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("id, name, slug, category, description, active, event_id, created_at, updated_at, events!inner(name, active)")
    .eq("active", true)
    .order("name");
  throwIfError(error, "Something went wrong while loading sessions.");
  const sessions = data ?? [];
  const counts = new Map<string, number>();
  if (sessions.length > 0) {
    const { data: lots, error: lotError } = await supabase
      .from("coffee_lots")
      .select("session_id")
      .eq("active", true)
      .in(
        "session_id",
        sessions.map((session) => session.id as string),
      );
    throwIfError(lotError, "Something went wrong while loading sessions.");
    for (const lot of lots ?? []) {
      const id = lot.session_id as string;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return sessions.map((session) => {
    const event = asOne(session.events as { name: string; active: boolean } | Array<{ name: string; active: boolean }> | null);
    return {
      id: session.id as string,
      name: session.name as string,
      slug: session.slug as string,
      category: session.category as string,
      description: session.description as string | null,
      eventName: event?.name ?? null,
      coffeeCount: counts.get(session.id as string) ?? 0,
    };
  });
}

export async function getCoffeesForSession(sessionId: string, activeOnly = true) {
  const supabase = getServiceClient();
  let query = supabase.from("coffee_lots").select("*").eq("session_id", sessionId).order("display_order", { ascending: true }).order("lot_name", { ascending: true });
  if (activeOnly) query = query.eq("active", true);
  const { data, error } = await query;
  throwIfError(error, "Something went wrong while loading the coffees.");
  return (data ?? []) as CoffeeLot[];
}

export async function readResumeTokens() {
  const cookieStore = await cookies();
  return parseResumeTokens(cookieStore.get(RESUME_COOKIE)?.value);
}

export async function findRunForSlug(slug: string) {
  const tokens = await readResumeTokens();
  if (tokens.length === 0) return null;
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("participant_sessions")
    .select("id, participant_id, session_id, started_at, completed_at, status, resume_token, sessions!inner(slug)")
    .in("resume_token", tokens)
    .eq("sessions.slug", slug)
    .order("started_at", { ascending: false });
  throwIfError(error, "Something went wrong while loading your cupping.");
  const rows = (data ?? []) as unknown as ParticipantSession[];
  return rows.find((row) => row.status === "in_progress") ?? rows[0] ?? null;
}

export async function getEvaluationsForRun(participantSessionId: string) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("evaluations")
    .select("coffee_lot_id, aroma_score, flavor_score, overall_score, aroma_note, flavor_note, overall_note")
    .eq("participant_session_id", participantSessionId);
  throwIfError(error, "Something went wrong while loading your evaluations.");
  return (data ?? []) as Array<{
    coffee_lot_id: string;
    aroma_score: number;
    flavor_score: number;
    overall_score: number;
    aroma_note: string | null;
    flavor_note: string | null;
    overall_note: string | null;
  }>;
}
