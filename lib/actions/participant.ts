"use server";

import { cookies } from "next/headers";
import { INCOMPLETE_RATINGS_MESSAGE, INCOMPLETE_SUBMISSION_MESSAGE, SAVE_FAILED_MESSAGE } from "@/lib/cupping";
import { getCoffeesForSession, getSessionBySlug } from "@/lib/data/cupping";
import { sendSessionEmail, type SessionMail } from "@/lib/email";
import { AppError, friendlyError, throwIfError } from "@/lib/errors";
import { isFormType, type FormTypeId } from "@/lib/forms";
import { addResumeToken, parseResumeTokens, removeResumeToken, RESUME_COOKIE, resumeCookieOptions } from "@/lib/resume";
import { getServiceClient } from "@/lib/supabase/admin";
import { asOne } from "@/lib/utils";
import { evaluationSchema, evaluationSyncSchema, startCuppingSchema, sessionSubmissionSchema, zodFieldErrors, type ActionResult } from "@/lib/validations";

type ScoreInput = {
  coffeeLotId: string;
  score: number;
  aroma: string | null;
  flavor: string | null;
  overall: string | null;
  totalScore?: number | null;
  formType?: string;
  payload?: Record<string, unknown>;
};

function noteColumns(evaluation: ScoreInput) {
  const note = (value: string | null) => value?.trim() || null;
  return {
    aroma_score: evaluation.score,
    flavor_score: evaluation.score,
    overall_score: evaluation.score,
    aroma_note: note(evaluation.aroma),
    flavor_note: note(evaluation.flavor),
    overall_note: note(evaluation.overall),
    comments: null,
  };
}

function evaluationRow(
  run: { id: string; participant_id: string; session_id: string },
  evaluation: ScoreInput,
) {
  return {
    participant_session_id: run.id,
    participant_id: run.participant_id,
    session_id: run.session_id,
    coffee_lot_id: evaluation.coffeeLotId,
    ...noteColumns(evaluation),
    form_type: isFormType(evaluation.formType) ? evaluation.formType : "bora",
    form_payload: evaluation.payload ?? null,
    total_score: evaluation.totalScore ?? null,
  };
}

function throwSaveError(error: { message: string } | null) {
  if (!error) return;
  if (/aroma_note|flavor_note|overall_note|schema cache/i.test(error.message)) {
    throw new AppError("Run the cupping notes update in the Supabase SQL editor, then save again.");
  }
  throwIfError(error, SAVE_FAILED_MESSAGE);
}

async function upsertEvaluations(run: { id: string; participant_id: string; session_id: string }, evaluations: ScoreInput[]) {
  const supabase = getServiceClient();
  const rows = evaluations.map((evaluation) => evaluationRow(run, evaluation));
  const first = await supabase.from("evaluations").upsert(rows, { onConflict: "participant_session_id,coffee_lot_id" });
  if (first.error && /form_payload|form_type|total_score|schema cache/i.test(first.error.message)) {
    const stripped = rows.map(({ form_type: _formType, form_payload: _payload, total_score: _total, ...rest }) => rest);
    const retry = await supabase.from("evaluations").upsert(stripped, { onConflict: "participant_session_id,coffee_lot_id" });
    throwSaveError(retry.error);
    return;
  }
  throwSaveError(first.error);
}

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

async function sessionMailForRun(run: { participant_id: string; session_id: string }): Promise<SessionMail | null> {
  const supabase = getServiceClient();
  const [{ data: person }, { data: session }, coffees] = await Promise.all([
    supabase.from("participants").select("name, email").eq("id", run.participant_id).maybeSingle(),
    supabase.from("sessions").select("name, events(name)").eq("id", run.session_id).maybeSingle(),
    getCoffeesForSession(run.session_id, true),
  ]);
  if (!person?.email) return null;
  const event = asOne(session?.events as { name: string } | { name: string }[] | null);
  return {
    to: person.email as string,
    name: (person.name as string) ?? "",
    eventName: event?.name ?? (session?.name as string) ?? "",
    sessionName: (session?.name as string) ?? "",
    cupCount: coffees.length,
  };
}

async function sendRunEmail(kind: "welcome" | "thanks", mail: SessionMail | null) {
  if (!mail) return;
  await sendSessionEmail(kind, mail);
}

async function writableRun(participantSessionId: string) {
  const run = await authorizedRun(participantSessionId);
  if (run.status === "completed") {
    const supabase = getServiceClient();
    const { error } = await supabase
      .from("participant_sessions")
      .update({ status: "in_progress", completed_at: null })
      .eq("id", run.id);
    throwIfError(error, SAVE_FAILED_MESSAGE);
    run.status = "in_progress";
  }
  if (run.status !== "in_progress") throw new AppError("This cupping has already been submitted.");
  return run;
}

export async function startCupping(slug: string, input: unknown): Promise<ActionResult> {
  const parsed = startCuppingSchema.safeParse(input);
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
    const lockedType = (session.form_type ?? "bora") as FormTypeId;
    const chosenType = session.form_policy === "choice" && isFormType(details.formType) ? details.formType : lockedType;
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

    const { data: existingRun, error: existingRunError } = await supabase
      .from("participant_sessions")
      .select("id, resume_token, status, form_type")
      .eq("participant_id", participantId)
      .eq("session_id", session.id)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const runLookupFailed = Boolean(existingRunError && /form_type|schema cache/i.test(existingRunError.message));
    const prior = runLookupFailed
      ? await supabase
          .from("participant_sessions")
          .select("id, resume_token, status")
          .eq("participant_id", participantId)
          .eq("session_id", session.id)
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: existingRun, error: existingRunError };
    throwIfError(prior.error, "Something went wrong while starting your cupping. Please try again.");

    let resumeToken = prior.data?.resume_token as string | undefined;
    const isNewRun = !prior.data?.id;
    if (prior.data?.id && prior.data.status === "completed") {
      const { error } = await supabase
        .from("participant_sessions")
        .update({ status: "in_progress", completed_at: null })
        .eq("id", prior.data.id);
      throwIfError(error, "Something went wrong while starting your cupping. Please try again.");
    }
    if (!resumeToken) {
      const insertWithForm = { participant_id: participantId, session_id: session.id, status: "in_progress" as const, form_type: chosenType };
      const created = await supabase.from("participant_sessions").insert(insertWithForm).select("resume_token").single();
      if (created.error && /form_type|schema cache/i.test(created.error.message)) {
        const fallback = await supabase
          .from("participant_sessions")
          .insert({ participant_id: participantId, session_id: session.id, status: "in_progress" })
          .select("resume_token")
          .single();
        throwIfError(fallback.error, "Something went wrong while starting your cupping. Please try again.");
        if (!fallback.data?.resume_token) throw new AppError("Something went wrong while starting your cupping. Please try again.");
        resumeToken = fallback.data.resume_token as string;
      } else {
        throwIfError(created.error, "Something went wrong while starting your cupping. Please try again.");
        if (!created.data?.resume_token) throw new AppError("Something went wrong while starting your cupping. Please try again.");
        resumeToken = created.data.resume_token as string;
      }
    }

    const cookieStore = await cookies();
    cookieStore.set(RESUME_COOKIE, addResumeToken(cookieStore.get(RESUME_COOKIE)?.value, resumeToken), resumeCookieOptions);
    if (isNewRun) {
      await sendRunEmail("welcome", {
        to: details.email,
        name: details.name,
        eventName: session.event?.name ?? session.name,
        sessionName: session.name,
        cupCount: coffees.length,
      });
    }
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
    const run = await writableRun(parsed.data.participantSessionId);
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
    await upsertEvaluations(run, [parsed.data]);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: friendlyError(error, SAVE_FAILED_MESSAGE) };
  }
}

export async function syncEvaluations(input: unknown): Promise<ActionResult> {
  const parsed = evaluationSyncSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: INCOMPLETE_RATINGS_MESSAGE, fieldErrors: zodFieldErrors(parsed.error) };
  }

  try {
    const run = await writableRun(parsed.data.participantSessionId);
    const supabase = getServiceClient();
    const { data: coffees, error: coffeeError } = await supabase
      .from("coffee_lots")
      .select("id, session_id, active")
      .eq("session_id", run.session_id)
      .eq("active", true);
    throwIfError(coffeeError, SAVE_FAILED_MESSAGE);
    const allowed = new Set((coffees ?? []).map((coffee) => coffee.id as string));
    const rows = parsed.data.evaluations.filter((evaluation) => allowed.has(evaluation.coffeeLotId));
    if (rows.length === 0) return { ok: true };
    await upsertEvaluations(run, rows);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: friendlyError(error, SAVE_FAILED_MESSAGE) };
  }
}

export async function saveAndSubmitCupping(input: unknown): Promise<ActionResult> {
  const parsed = sessionSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: INCOMPLETE_SUBMISSION_MESSAGE, fieldErrors: zodFieldErrors(parsed.error) };
  }

  try {
    const run = await writableRun(parsed.data.participantSessionId);
    const supabase = getServiceClient();
    const { data: coffees, error: coffeeError } = await supabase.from("coffee_lots").select("id, lot_name").eq("session_id", run.session_id).eq("active", true);
    throwIfError(coffeeError, SAVE_FAILED_MESSAGE);
    const coffeeIds = new Set((coffees ?? []).map((coffee) => coffee.id as string));
    const submittedIds = new Set(parsed.data.evaluations.map((evaluation) => evaluation.coffeeLotId));
    const missing = (coffees ?? []).find((coffee) => !submittedIds.has(coffee.id as string));
    const onlySessionCoffees = parsed.data.evaluations.every((evaluation) => coffeeIds.has(evaluation.coffeeLotId));
    if (missing || !onlySessionCoffees || coffeeIds.size === 0) {
      throw new AppError(missing ? `Please finish ${missing.lot_name as string} before saving.` : INCOMPLETE_SUBMISSION_MESSAGE);
    }

    await upsertEvaluations(run, parsed.data.evaluations);

    const { error: completeError } = await supabase
      .from("participant_sessions")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", run.id)
      .eq("status", "in_progress");
    throwIfError(completeError, SAVE_FAILED_MESSAGE);
    await sendRunEmail("thanks", await sessionMailForRun(run));
    return { ok: true };
  } catch (error) {
    return { ok: false, message: friendlyError(error, SAVE_FAILED_MESSAGE) };
  }
}

export async function submitCupping(participantSessionId: string): Promise<ActionResult> {
  try {
    const run = await writableRun(participantSessionId);
    const supabase = getServiceClient();
    const [{ data: coffees, error: coffeeError }, { data: evaluations, error: evaluationError }] = await Promise.all([
      supabase.from("coffee_lots").select("id, lot_name").eq("session_id", run.session_id).eq("active", true),
      supabase.from("evaluations").select("coffee_lot_id, overall_score, aroma_note, flavor_note, overall_note").eq("participant_session_id", run.id),
    ]);
    throwIfError(coffeeError, "Something went wrong while submitting your cupping. Please try again.");
    throwIfError(evaluationError, "Something went wrong while submitting your cupping. Please try again.");

    const byCoffee = new Map((evaluations ?? []).map((evaluation) => [evaluation.coffee_lot_id as string, evaluation]));
    const missing = (coffees ?? []).find((coffee) => {
      const evaluation = byCoffee.get(coffee.id as string);
      return !evaluation || evaluation.overall_score == null;
    });
    if (missing || (coffees ?? []).length === 0) {
      throw new AppError(missing ? `Please finish ${missing.lot_name as string} before saving.` : INCOMPLETE_SUBMISSION_MESSAGE);
    }

    const { error } = await supabase
      .from("participant_sessions")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", run.id)
      .eq("status", "in_progress");
    throwIfError(error, "Something went wrong while submitting your cupping. Please try again.");
    await sendRunEmail("thanks", await sessionMailForRun(run));
    return { ok: true };
  } catch (error) {
    return { ok: false, message: friendlyError(error, "Something went wrong while submitting your cupping. Please try again.") };
  }
}

export async function leaveCupping(participantSessionId: string): Promise<ActionResult> {
  try {
    const run = await authorizedRun(participantSessionId);
    const supabase = getServiceClient();
    if (run.status === "in_progress") {
      const { count, error: countError } = await supabase
        .from("evaluations")
        .select("id", { count: "exact", head: true })
        .eq("participant_session_id", run.id);
      throwIfError(countError, "Something went wrong while leaving this table.");
      if ((count ?? 0) === 0) {
        const { error } = await supabase.from("participant_sessions").delete().eq("id", run.id);
        throwIfError(error, "Something went wrong while leaving this table.");
      }
    }
    const cookieStore = await cookies();
    const remaining = removeResumeToken(cookieStore.get(RESUME_COOKIE)?.value, run.resume_token);
    cookieStore.set(RESUME_COOKIE, remaining, remaining ? resumeCookieOptions : { ...resumeCookieOptions, maxAge: 0 });
    return { ok: true };
  } catch (error) {
    return { ok: false, message: friendlyError(error, "Something went wrong while leaving this table.") };
  }
}
