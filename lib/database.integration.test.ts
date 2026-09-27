import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const live = Boolean(url && serviceKey && anonKey);

describe.skipIf(!live)("database", () => {
  it("keeps participant records private from the anon key and prevents duplicate evaluations", async () => {
    const admin = createClient(url!, serviceKey!, { auth: { persistSession: false } });
    const anon = createClient(url!, anonKey!, { auth: { persistSession: false } });
    const stamp = Date.now();
    const email = `vitest.${stamp}@example.com`;

    const { data: event, error: eventError } = await admin
      .from("events")
      .insert({ name: `Vitest event ${stamp}`, active: true })
      .select("id")
      .single();
    expect(eventError).toBeNull();

    const { data: session, error: sessionError } = await admin
      .from("sessions")
      .insert({ event_id: event!.id, name: "Vitest", category: "Test", slug: `vitest-${stamp}`, active: true })
      .select("id")
      .single();
    expect(sessionError).toBeNull();

    const { data: coffee, error: coffeeError } = await admin
      .from("coffee_lots")
      .insert({ session_id: session!.id, lot_name: "Vitest lot", display_order: 1, active: true })
      .select("id")
      .single();
    expect(coffeeError).toBeNull();

    const { data: participant, error: participantError } = await admin
      .from("participants")
      .insert({ name: "Vitest Person", email, country: "Rwanda" })
      .select("id")
      .single();
    expect(participantError).toBeNull();

    const { data: run, error: runError } = await admin
      .from("participant_sessions")
      .insert({ participant_id: participant!.id, session_id: session!.id, status: "in_progress" })
      .select("id")
      .single();
    expect(runError).toBeNull();

    const evaluation = {
      participant_session_id: run!.id,
      participant_id: participant!.id,
      session_id: session!.id,
      coffee_lot_id: coffee!.id,
      aroma_score: 4,
      flavor_score: 5,
      overall_score: 4,
      comments: "Very clean and sweet.",
    };
    const { error: insertError } = await admin.from("evaluations").insert(evaluation);
    expect(insertError).toBeNull();
    const { error: duplicateError } = await admin.from("evaluations").insert(evaluation);
    expect(duplicateError).not.toBeNull();

    const { data: leaked, error: leakError } = await anon.from("participants").select("email").eq("email", email);
    expect(leakError || (leaked ?? []).length === 0).toBeTruthy();

    const { error: anonInsertError } = await anon.from("evaluations").insert(evaluation);
    expect(anonInsertError).not.toBeNull();

    await admin.from("sessions").delete().eq("id", session!.id);
    await admin.from("participants").delete().eq("id", participant!.id);
    await admin.from("events").delete().eq("id", event!.id);
  });
});
