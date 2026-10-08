import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import {
  buildDemoCoffees,
  buildDemoEvaluations,
  buildDemoParticipantSessions,
  DEMO_EVENT,
  DEMO_PARTICIPANTS,
  DEMO_SESSIONS,
} from "../database/demo-data";

function loadEnv(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

loadEnv(".env.local");
loadEnv(".env");

async function main() {
  if (process.env.ALLOW_SAMPLE_SEED !== "true") {
    console.error("Refusing to seed. This overwrites lots that share the sample IDs used in the live cupping catalog.");
    console.error("Set ALLOW_SAMPLE_SEED=true only on an empty local database.");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.");
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: eventError } = await supabase.from("events").upsert(DEMO_EVENT);
  if (eventError) throw eventError;
  const { error: sessionError } = await supabase.from("sessions").upsert(DEMO_SESSIONS);
  if (sessionError) throw sessionError;
  const { error: coffeeError } = await supabase.from("coffee_lots").upsert(buildDemoCoffees());
  if (coffeeError) throw coffeeError;
  const { error: participantError } = await supabase.from("participants").upsert([...DEMO_PARTICIPANTS]);
  if (participantError) throw participantError;

  const runs = buildDemoParticipantSessions();
  const { error: runError } = await supabase.from("participant_sessions").upsert(runs);
  if (runError) throw runError;

  const { error: deleteError } = await supabase.from("evaluations").delete().in(
    "participant_session_id",
    runs.map((run) => run.id),
  );
  if (deleteError) throw deleteError;
  const { error: evaluationError } = await supabase.from("evaluations").insert(buildDemoEvaluations());
  if (evaluationError) throw evaluationError;

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const { data: listed, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (listError) throw listError;
    let user = listed.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createError) throw createError;
      user = created.user ?? undefined;
    }
    if (!user) throw new Error("Could not create the admin user.");
    const { error: profileError } = await supabase.from("admin_profiles").upsert({ user_id: user.id });
    if (profileError) throw profileError;
    console.log(`Admin access granted to ${email}.`);
  }

  console.log("Sample catalog written. Do not run this against the live cupping database.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
