import { mkdirSync, writeFileSync } from "node:fs";
import {
  buildDemoCoffees,
  buildDemoEvaluations,
  buildDemoParticipantSessions,
  DEMO_EVENT,
  DEMO_PARTICIPANTS,
  DEMO_SESSIONS,
} from "../database/demo-data";

function sqlText(value: string | null | undefined) {
  if (value == null) return "null";
  return `'${value.replaceAll("'", "''")}'`;
}

function sqlBool(value: boolean) {
  return value ? "true" : "false";
}

const coffees = buildDemoCoffees();
const runs = buildDemoParticipantSessions();
const evaluations = buildDemoEvaluations();

const sql = `-- Fictional demo data for local development.
-- These coffees, participants, and scores are not official Best of Rwanda results.
-- Safe to re-run.

begin;

insert into public.events (id, name, description, start_date, end_date, active)
values (
  ${sqlText(DEMO_EVENT.id)},
  ${sqlText(DEMO_EVENT.name)},
  ${sqlText(DEMO_EVENT.description)},
  ${sqlText(DEMO_EVENT.start_date)},
  ${sqlText(DEMO_EVENT.end_date)},
  ${sqlBool(DEMO_EVENT.active)}
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  active = excluded.active;

insert into public.sessions (id, event_id, name, category, slug, description, active)
values
${DEMO_SESSIONS.map(
  (session) => `  (${sqlText(session.id)}, ${sqlText(session.event_id)}, ${sqlText(session.name)}, ${sqlText(session.category)}, ${sqlText(session.slug)}, ${sqlText(session.description)}, ${sqlBool(session.active)})`,
).join(",\n")}
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  slug = excluded.slug,
  description = excluded.description,
  active = excluded.active;

insert into public.coffee_lots (
  id, session_id, lot_name, lot_number, cupping_code, washing_station, district, country,
  variety, process, altitude, harvest, producer, cooperative, description, display_order, active
)
values
${coffees
  .map(
    (coffee) => `  (${[
      coffee.id,
      coffee.session_id,
      coffee.lot_name,
      coffee.lot_number,
      coffee.cupping_code,
      coffee.washing_station,
      coffee.district,
      coffee.country,
      coffee.variety,
      coffee.process,
      coffee.altitude,
      coffee.harvest,
      coffee.producer,
      coffee.cooperative,
      coffee.description,
    ]
      .map((value) => sqlText(value))
      .join(", ")}, ${coffee.display_order}, ${sqlBool(coffee.active)})`,
  )
  .join(",\n")}
on conflict (id) do update set
  lot_name = excluded.lot_name,
  lot_number = excluded.lot_number,
  cupping_code = excluded.cupping_code,
  washing_station = excluded.washing_station,
  district = excluded.district,
  country = excluded.country,
  variety = excluded.variety,
  process = excluded.process,
  altitude = excluded.altitude,
  harvest = excluded.harvest,
  producer = excluded.producer,
  cooperative = excluded.cooperative,
  description = excluded.description,
  display_order = excluded.display_order,
  active = excluded.active;

insert into public.participants (id, name, email, country, organization, role)
values
${DEMO_PARTICIPANTS.map(
  (participant) =>
    `  (${sqlText(participant.id)}, ${sqlText(participant.name)}, ${sqlText(participant.email)}, ${sqlText(participant.country)}, ${sqlText(participant.organization)}, ${sqlText(participant.role)})`,
).join(",\n")}
on conflict (id) do update set
  name = excluded.name,
  country = excluded.country,
  organization = excluded.organization,
  role = excluded.role;

insert into public.participant_sessions (id, participant_id, session_id, started_at, completed_at, status, resume_token)
values
${runs
  .map(
    (run) =>
      `  (${sqlText(run.id)}, ${sqlText(run.participant_id)}, ${sqlText(run.session_id)}, ${sqlText(run.started_at)}, ${sqlText(run.completed_at)}, ${sqlText(run.status)}, ${sqlText(run.resume_token)})`,
  )
  .join(",\n")}
on conflict (id) do update set
  status = excluded.status,
  completed_at = excluded.completed_at;

delete from public.evaluations
where participant_session_id in (${runs.map((run) => sqlText(run.id)).join(", ")});

insert into public.evaluations (
  participant_session_id, participant_id, session_id, coffee_lot_id,
  aroma_score, flavor_score, overall_score, comments
)
values
${evaluations
  .map(
    (evaluation) =>
      `  (${sqlText(evaluation.participant_session_id)}, ${sqlText(evaluation.participant_id)}, ${sqlText(evaluation.session_id)}, ${sqlText(evaluation.coffee_lot_id)}, ${evaluation.aroma_score}, ${evaluation.flavor_score}, ${evaluation.overall_score}, ${sqlText(evaluation.comments)})`,
  )
  .join(",\n")};

commit;
`;

mkdirSync("supabase", { recursive: true });
writeFileSync("supabase/seed.sql", sql);
console.log(`Wrote supabase/seed.sql with ${coffees.length} coffees and ${evaluations.length} evaluations.`);
