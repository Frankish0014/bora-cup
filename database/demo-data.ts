import { EVENT_DESCRIPTION, FULLY_WASHED_DESCRIPTION, SPECIAL_PROCESS_DESCRIPTION } from "../lib/content/competition";

export const DEMO_EVENT_ID = "11111111-1111-4111-8111-111111111111";
export const FULLY_WASHED_SESSION_ID = "22222222-2222-4222-8222-222222222201";
export const SPECIAL_PROCESS_SESSION_ID = "22222222-2222-4222-8222-222222222202";

export function demoUuid(prefix: string, n: number) {
  return `${prefix}${n.toString(16).padStart(12, "0")}`;
}

export const DEMO_EVENT = {
  id: DEMO_EVENT_ID,
  name: "Best of Rwanda Cup Tour 2026",
  description: EVENT_DESCRIPTION,
  start_date: "2026-09-01",
  end_date: "2026-09-30",
  active: true,
};

export const DEMO_SESSIONS = [
  {
    id: FULLY_WASHED_SESSION_ID,
    event_id: DEMO_EVENT_ID,
    name: "Fully Washed",
    category: "Fully Washed",
    slug: "fully-washed",
    description: FULLY_WASHED_DESCRIPTION,
    active: true,
  },
  {
    id: SPECIAL_PROCESS_SESSION_ID,
    event_id: DEMO_EVENT_ID,
    name: "Special Process",
    category: "Special Process",
    slug: "special-process",
    description: SPECIAL_PROCESS_DESCRIPTION,
    active: true,
  },
] as const;

const VARIETIES = ["Red Bourbon", "Bourbon", "Jackson"];
const FW_ORIGINS = [
  ["Cyeza CWS", "Muhanga", 1900],
  ["Huye Station", "Huye", 1750],
  ["Mugonero CWS", "Nyamasheke", 1850],
  ["Nyamagabe Station", "Nyamagabe", 2000],
  ["Kayumbu CWS", "Kamonyi", 1800],
  ["Rulindo Station", "Rulindo", 2050],
  ["Gisagara Station", "Gisagara", 1950],
] as const;

const SP_PROCESSES = [
  "Natural",
  "Honey",
  "Anaerobic Natural",
  "Carbonic Maceration",
  "Lactic Fermentation",
  "Yeast Fermentation",
  "Experimental",
  "Natural",
  "Honey",
  "Anaerobic Washed",
  "Infused Natural",
  "Double Fermentation",
  "Natural",
  "Honey",
  "Experimental",
  "Anaerobic Natural",
  "Carbonic Maceration",
  "Natural",
];

const SP_ORIGINS = [
  ["Huye Station", "Huye"],
  ["Ngororero CWS", "Ngororero"],
  ["Muhanga Station", "Muhanga"],
  ["Nyaruguru Station", "Nyaruguru"],
  ["Ngoma CWS", "Nyamasheke"],
  ["Gicumbi Station", "Gicumbi"],
  ["Huye Station", "Huye"],
  ["Ruhango Station", "Ruhango"],
  ["Muganza CWS", "Nyamagabe"],
  ["Ruhango Station", "Ruhango"],
  ["Ngororero Station", "Ngororero"],
  ["Ruhango Station", "Ruhango"],
  ["Kanyege CWS", "Nyamasheke"],
  ["Bweyeye CWS", "Rusizi"],
  ["Muhazi CWS", "Muhanga"],
  ["Cyiwa CWS", "Nyamasheke"],
  ["Gisanga CWS", "Ruhango"],
  ["Nyamasheke Station", "Nyamasheke"],
] as const;

export type DemoCoffee = {
  id: string;
  session_id: string;
  lot_name: string;
  lot_number: string;
  cupping_code: string;
  washing_station: string;
  district: string;
  country: string;
  variety: string;
  process: string;
  altitude: string;
  harvest: string;
  producer: string | null;
  cooperative: string | null;
  description: string | null;
  display_order: number;
  active: boolean;
};

function altitude(meters: number) {
  return `${meters.toLocaleString("en-US")} MASL`;
}

export function buildDemoCoffees(): DemoCoffee[] {
  const washed = FW_ORIGINS.map(([station, district, meters], index) => {
    const n = index + 1;
    return {
      id: demoUuid("33333333-3333-4333-8333-", n),
      session_id: FULLY_WASHED_SESSION_ID,
      lot_name: `Fully Washed #${n}`,
      lot_number: `FW-${String(n).padStart(3, "0")}`,
      cupping_code: `BORA-FW-${String(n).padStart(3, "0")}`,
      washing_station: station,
      district,
      country: "Rwanda",
      variety: VARIETIES[index % VARIETIES.length],
      process: "Fully Washed",
      altitude: altitude(meters),
      harvest: "2026",
      producer: null,
      cooperative: null,
      description: null,
      display_order: n,
      active: true,
    };
  });

  const special = SP_PROCESSES.map((process, index) => {
    const n = index + 1;
    const [station, district] = SP_ORIGINS[index];
    return {
      id: demoUuid("33333333-3333-4333-8333-", n + 7),
      session_id: SPECIAL_PROCESS_SESSION_ID,
      lot_name: `Special Process #${n}`,
      lot_number: `SP-${String(n).padStart(3, "0")}`,
      cupping_code: `BORA-SP-${String(n).padStart(3, "0")}`,
      washing_station: station,
      district,
      country: "Rwanda",
      variety: VARIETIES[index % VARIETIES.length],
      process,
      altitude: altitude(1650 + (index % 8) * 50),
      harvest: "2026",
      producer: null,
      cooperative: null,
      description: null,
      display_order: n,
      active: true,
    };
  });

  return [...washed, ...special];
}

export const DEMO_PARTICIPANTS = [
  {
    id: demoUuid("44444444-4444-4444-8444-", 1),
    name: "Aline Uwase",
    email: "aline.uwase@example.com",
    country: "Rwanda",
    organization: "Kigali Roastery",
    role: "Roaster",
  },
  {
    id: demoUuid("44444444-4444-4444-8444-", 2),
    name: "James Otieno",
    email: "james.otieno@example.com",
    country: "Kenya",
    organization: "Nairobi Import Co",
    role: "Buyer",
  },
  {
    id: demoUuid("44444444-4444-4444-8444-", 3),
    name: "Sofia Martin",
    email: "sofia.martin@example.com",
    country: "France",
    organization: "Paris Cafe",
    role: "Cafe owner",
  },
  {
    id: demoUuid("44444444-4444-4444-8444-", 4),
    name: "Mei Chen",
    email: "mei.chen@example.com",
    country: "United States",
    organization: "Seattle Coffee Lab",
    role: "Q Grader",
  },
  {
    id: demoUuid("44444444-4444-4444-8444-", 5),
    name: "Omar Hassan",
    email: "omar.hassan@example.com",
    country: "United Arab Emirates",
    organization: "Dubai Trading",
    role: "Importer",
  },
] as const;

export type DemoParticipantSession = {
  id: string;
  participant_id: string;
  session_id: string;
  started_at: string;
  completed_at: string | null;
  status: "in_progress" | "completed";
  resume_token: string;
};

export function buildDemoParticipantSessions(): DemoParticipantSession[] {
  const rows: DemoParticipantSession[] = [];
  let n = 1;
  for (const participant of DEMO_PARTICIPANTS) {
    for (const session of DEMO_SESSIONS) {
      const inProgress = participant.email === "mei.chen@example.com" && session.slug === "special-process";
      rows.push({
        id: demoUuid("55555555-5555-4555-8555-", n),
        participant_id: participant.id,
        session_id: session.id,
        started_at: "2026-09-20T09:00:00.000Z",
        completed_at: inProgress ? null : "2026-09-20T11:30:00.000Z",
        status: inProgress ? "in_progress" : "completed",
        resume_token: demoUuid("66666666-6666-4666-8666-", n),
      });
      n += 1;
    }
  }
  return rows;
}

export function demoScore(seed: string): 1 | 2 | 3 | 4 | 5 {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 33 + seed.charCodeAt(index)) >>> 0;
  }
  return ((hash % 5) + 1) as 1 | 2 | 3 | 4 | 5;
}

const DEMO_COMMENTS = [
  "Very clean and sweet.",
  "Beautiful floral aroma.",
  "Interesting acidity.",
  "Would definitely cup this again.",
  "Soft, sweet, and easy to like.",
  "Juicy cup with a long finish.",
];

export function demoComment(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 33 + seed.charCodeAt(index)) >>> 0;
  }
  if (hash % 4 === 0) return null;
  return DEMO_COMMENTS[hash % DEMO_COMMENTS.length];
}

export function buildDemoEvaluations() {
  const coffees = buildDemoCoffees();
  return buildDemoParticipantSessions().flatMap((run) => {
    if (run.status !== "completed") return [];
    return coffees
      .filter((coffee) => coffee.session_id === run.session_id)
      .map((coffee) => {
        const seed = `${run.id}:${coffee.id}`;
        return {
          participant_session_id: run.id,
          participant_id: run.participant_id,
          session_id: run.session_id,
          coffee_lot_id: coffee.id,
          aroma_score: demoScore(`${seed}:aroma`),
          flavor_score: demoScore(`${seed}:flavor`),
          overall_score: demoScore(`${seed}:overall`),
          aroma_note: demoComment(`${seed}:aroma`),
          flavor_note: demoComment(`${seed}:flavor`),
          overall_note: demoComment(`${seed}:overall`),
        };
      });
  });
}
