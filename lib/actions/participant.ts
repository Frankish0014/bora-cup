"use server";

import { cookies } from "next/headers";
import { INCOMPLETE_RATINGS_MESSAGE, INCOMPLETE_SUBMISSION_MESSAGE, SAVE_FAILED_MESSAGE, parseNotes, serializeNotes } from "@/lib/cupping";
import { getCoffeesForSession, getSessionBySlug } from "@/lib/data/cupping";
import { AppError, friendlyError, throwIfError } from "@/lib/errors";
import { addResumeToken, parseResumeTokens, RESUME_COOKIE, resumeCookieOptions } from "@/lib/resume";
import { getServiceClient } from "@/lib/supabase/admin";
import { evaluationSchema, participantSchema, zodFieldErrors, type ActionResult } from "@/lib/validations";

async function authorizedRun(participantSessionId: string) {
  const cookieStore = await cookies();
  const tokens = parseResumeTokens(cookieStore.get(RESUME_COOKIE)?.value);
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("participant_sessions")
    .select("id, participant_id, session_id, status, resume_token, sessions(active)")
    .eq("id", participantSessionId)
    .maybeSingle();
  throwIfError(error, SAVE_FAILED_MESSAGE);
  const run = data as {
    id: string;
    participant_id: string;
    session_id: string;
    status: string;
    resume_token: string;
    sessions: { active?: boolean } | Array<{ active?: boolean }> | null;
  } | null;
  if (!run || !tokens.includes(run.resume_token)) {
    throw new AppError("Your cupping session could not be verified. Please start again.");
  }
  return run;
}

export async function startCupping(slug: string, input: unknown): Promise<ActionResult> {
  const parsed = participantSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Please check your details.", fieldErrors: zodFieldErrors(parsed.error) };
  }

  try {
    const session = await getSessionBySlug(slug);
    if (!session) throw new AppError("We couldn't find that cupping session. Check the QR code and try again.");
    if (!session.active) {
      throw new AppError("This cupping session is not open right now.");
    }

    const coffees = await getCoffeesForSession(session.id, true);
    if (coffees.length === 0) throw new AppError("No coffees are available in this session yet.");

    const supabase = getServiceClient();
    const details = parsed.data;
    const { data: existing, error: existingError } = await supabase.from("participants").select("id").eq("email", details.email).maybeSingle();
    throwIfError(existingError, "Something went wrong while starting your cupping. Please try again.");

    let participantId = existing?.id as string | undefined;
    if (participantId) {
      const { error } = await supabase
        .from("participants")
        .update({
          name: details.name,
          country: details.country,
          organization: details.organization,
          role: details.role,
        })
        .eq("id", participantId);
      throwIfError(error, "Something went wrong while starting your cupping. Please try again.");
    } else {
      const { data: created, error } = await supabase
        .from("participants")
        .insert({
          name: details.name,
          email: details.email,
          country: details.country,
          organization: details.organization,
          role: details.role,
        })
        .select("id")
        .single();
      if (error?.code === "23505") {
        const { data: raced, error: racedError } = await supabase.from("participants").select("id").eq("email", details.email).maybeSingle();
        throwIfError(racedError, "Something went wrong while starting your cupping. Please try again.");
        participantId = raced?.id as string | undefined;
      } else {
        throwIfError(error, "Something went wrong while starting your cupping. Please try again.");
        participantId = created?.id as string;
      }
    }

    if (!participantId) throw new AppError("Something went wrong while starting your cupping. Please try again.");

    const { data: openRun, error: openError } = await supabase
      .from("participant_sessions")
      .select("id, resume_token")
      .eq("participant_id", participantId)
      .eq("session_id", session.id)
      .eq("status", "in_progress")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    throwIfError(openError, "Something went wrong while starting your cupping. Please try again.");

    let resumeToken = openRun?.resume_token as string | undefined;
    if (!resumeToken) {
      const { data: createdRun, error: runError } = await supabase
        .from("participant_sessions")
        .insert({ participant_id: participantId, session_id: session.id, status: "in_progress" })
        .select("resume_token")
        .single();
      throwIfError(runError, "Something went wrong while starting your cupping. Please try again.");
      if (!createdRun?.resume_token) throw new AppError("Something went wrong while starting your cupping. Please try again.");
      resumeToken = createdRun.resume_token as string;
    }

    const cookieStore = await cookies();
    cookieStore.set(RESUME_COOKIE, addResumeToken(cookieStore.get(RESUME_COOKIE)?.value, resumeToken), resumeCookieOptions);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: friendlyError(error, "Something went wrong while starting your cupping. Please try again.") };
  }
}

export async function saveEvaluation(input: unknown): Promise<ActionResult> {
  const parsed = evaluationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: INCOMPLETE_RATINGS_MESSAGE, fieldErrors: zodFieldErrors(parsed.error) };
  }

  try {
    const run = await authorizedRun(parsed.data.participantSessionId);
    if (run.status !== "in_progress") throw new AppError("This cupping has already been submitted.");
    const sessionActive = Array.isArray(run.sessions) ? run.sessions[0]?.active : run.sessions?.active;
    if (sessionActive === false) throw new AppError("This cupping session is not open right now.");

    const supabase = getServiceClient();
    const { data: coffee, error: coffeeError } = await supabase
      .from("coffee_lots")
      .select("id, session_id, active")
      .eq("id", parsed.data.coffeeLotId)
      .maybeSingle();
    throwIfError(coffeeError, SAVE_FAILED_MESSAGE);
    if (!coffee || !coffee.active || coffee.session_id !== run.session_id) {
      throw new AppError("That coffee is no longer part of this session.");
    }

    const comments = serializeNotes(parsed.data);
    const { error } = await supabase.from("evaluations").upsert(
      {
        participant_session_id: run.id,
        participant_id: run.participant_id,
        session_id: run.session_id,
        coffee_lot_id: coffee.id,
        aroma_score: parsed.data.score,
        flavor_score: parsed.data.score,
        overall_score: parsed.data.score,
        comments,
      },
      { onConflict: "participant_session_id,coffee_lot_id" },
    );
    throwIfError(error, SAVE_FAILED_MESSAGE);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: friendlyError(error, SAVE_FAILED_MESSAGE) };
  }
}

export async function submitCupping(participantSessionId: string): Promise<ActionResult> {
  try {
    const run = await authorizedRun(participantSessionId);
    if (run.status === "completed") return { ok: true };

    const supabase = getServiceClient();
    const [{ data: coffees, error: coffeeError }, { data: evaluations, error: evaluationError }] = await Promise.all([
      supabase.from("coffee_lots").select("id").eq("session_id", run.session_id).eq("active", true),
      supabase.from("evaluations").select("coffee_lot_id, overall_score, comments").eq("participant_session_id", run.id),
    ]);
    throwIfError(coffeeError, "Something went wrong while submitting your cupping. Please try again.");
    throwIfError(evaluationError, "Something went wrong while submitting your cupping. Please try again.");

    const byCoffee = new Map((evaluations ?? []).map((evaluation) => [evaluation.coffee_lot_id as string, evaluation]));
    const missing = (coffees ?? []).some((coffee) => {
      const evaluation = byCoffee.get(coffee.id as string);
      const notes = parseNotes(evaluation?.comments as string | null | undefined);
      return !evaluation || evaluation.overall_score == null || !notes.aroma.trim() || !notes.flavor.trim() || !notes.overall.trim();
    });
    if (missing || (coffees ?? []).length === 0) {
      throw new AppError(INCOMPLETE_SUBMISSION_MESSAGE);
    }

    const { error } = await supabase
      .from("participant_sessions")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", run.id)
      .eq("status", "in_progress");
    throwIfError(error, "Something went wrong while submitting your cupping. Please try again.");
    return { ok: true };
  } catch (error) {
    return { ok: false, message: friendlyError(error, "Something went wrong while submitting your cupping. Please try again.") };
  }
}
