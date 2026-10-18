import "server-only";
import { getCoffeesForSession, getSessionBySlug, type SessionWithEvent } from "@/lib/data/cupping";
import { throwIfError } from "@/lib/errors";
import { formSessionReview, type ReviewEvalInput, type ReviewRunInput, type SessionReview } from "@/lib/review";
import { isValidShareToken } from "@/lib/share";
import { getServiceClient } from "@/lib/supabase/admin";
import type { CoffeeLot } from "@/types/domain";

export async function getSharedTable(slug: string, token: string): Promise<{ session: SessionWithEvent; coffees: CoffeeLot[] } | null> {
  const session = await getSessionBySlug(slug);
  if (!session || !isValidShareToken(session.id, token)) return null;
  const coffees = await getCoffeesForSession(session.id, true);
  return { session, coffees };
}

export async function getSharedReview(slug: string, token: string): Promise<SessionReview | null> {
  const shared = await getSharedTable(slug, token);
  if (!shared) return null;
  const { session, coffees } = shared;
  const supabase = getServiceClient();

  const runsSelect =
    "id, status, completed_at, started_at, form_type, participant_id, participants(id, name, country, organization, role)";
  const runsFallback =
    "id, status, completed_at, started_at, participant_id, participants(id, name, country, organization, role)";
  const firstRuns = await supabase.from("participant_sessions").select(runsSelect).eq("session_id", session.id);
  const runs = firstRuns.error && /form_type|schema cache/i.test(firstRuns.error.message)
    ? await supabase.from("participant_sessions").select(runsFallback).eq("session_id", session.id)
    : firstRuns;
  throwIfError(runs.error, "Something went wrong while loading this review.");

  const evalSelect =
    "participant_session_id, coffee_lot_id, overall_score, aroma_note, flavor_note, overall_note, total_score, updated_at, form_type";
  const evalFallback = "participant_session_id, coffee_lot_id, overall_score, aroma_note, flavor_note, overall_note, updated_at";
  const firstEvals = await supabase.from("evaluations").select(evalSelect).eq("session_id", session.id);
  const evaluations = firstEvals.error && /total_score|form_type|schema cache/i.test(firstEvals.error.message)
    ? await supabase.from("evaluations").select(evalFallback).eq("session_id", session.id)
    : firstEvals;
  throwIfError(evaluations.error, "Something went wrong while loading this review.");

  return formSessionReview({
    eventName: session.event?.name ?? session.name,
    sessionName: session.name,
    category: session.category,
    slug: session.slug,
    coffees,
    runs: (runs.data ?? []) as ReviewRunInput[],
    evaluations: (evaluations.data ?? []) as ReviewEvalInput[],
  });
}
