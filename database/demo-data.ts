export const DEMO_EVENT_ID = "11111111-1111-4111-8111-111111111111";
export const FULLY_WASHED_SESSION_ID = "22222222-2222-4222-8222-222222222201";
export const SPECIAL_PROCESS_SESSION_ID = "22222222-2222-4222-8222-222222222202";

export function demoUuid(prefix: string, n: number) {
  return `${prefix}${n.toString(16).padStart(12, "0")}`;
}

export const DEMO_EVENT = {
  id: DEMO_EVENT_ID,
  name: "Best of Rwanda Cup Tour 2026",
  description:
    "Demo event for development. Coffee lots, participants, and scores in this seed are fictional and are not official Best of Rwanda results.",
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
    description: "Demo cupping session. These lots are fictional.",
    active: true,
  },
  {
    id: SPECIAL_PROCESS_SESSION_ID,
    event_id: DEMO_EVENT_ID,
    name: "Special Process",
    category: "Special Process",
    slug: "special-process",
    description: "Demo cupping session. These lots are fictional.",
    active: true,
  },
] as const;

const VARIETIES = ["Red Bourbon", "Bourbon", "Jackson"];
const FW_ORIGINS = [
  ["Demo Washing Station", "Demo District", 1900],
  ["Demo Station North", "Demo Highlands", 1750],
  ["Demo Station East", "Demo Valley", 1850],
  ["Demo Station South", "Demo Ridge", 2000],
  ["Demo Station West", "Demo Plateau", 1800],
  ["Demo Station Central", "Demo Hills", 2050],
  ["Demo Station Lakeside", "Demo Shore", 1950],
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
  ["Demo Station Alba", "Demo Slope"],
  ["Demo Station Brava", "Demo Terrace"],
  ["Demo Station Cera", "Demo Basin"],
  ["Demo Station Dore", "Demo Crest"],
  ["Demo Station Elma", "Demo Fold"],
  ["Demo Station Fino", "Demo Knoll"],
  ["Demo Station Gera", "Demo Ledge"],
  ["Demo Station Halo", "Demo Meadow"],
  ["Demo Station Iris", "Demo Notch"],
  ["Demo Station Jora", "Demo Orchard"],
  ["Demo Station Kira", "Demo Pasture"],
  ["Demo Station Luma", "Demo Quarry"],
  ["Demo Station Mira", "Demo Ravine"],
  ["Demo Station Nova", "Demo Spur"],
  ["Demo Station Ora", "Demo Table"],
  ["Demo Station Pela", "Demo Upland"],
  ["Demo Station Quill", "Demo Vista"],
  ["Demo Station Rona", "Demo Wash"],
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
      producer: n % 3 === 0 ? `Demo Producer ${n}` : null,
      cooperative: n % 4 === 0 ? `Demo Cooperative ${n}` : null,
      description: n === 1 ? "Demo lot for development. Not an official Best of Rwanda result." : null,
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
      producer: n % 3 === 0 ? `Demo Producer SP ${n}` : null,
      cooperative: n % 5 === 0 ? `Demo Cooperative SP ${n}` : null,
      description: n === 1 ? "Demo lot for development. Not an official Best of Rwanda result." : null,
      display_order: n,
      active: true,
    };
  });

  return [...washed, ...special];
}

export const DEMO_PARTICIPANTS = [
  {
    id: demoUuid("44444444-4444-4444-8444-", 1),
    name: "Aline Demo",
    email: "aline.demo@example.com",
    country: "Rwanda",
    organization: "Demo Roastery",
    role: "Roaster",
  },
  {
    id: demoUuid("44444444-4444-4444-8444-", 2),
    name: "James Demo",
    email: "james.demo@example.com",
    country: "Kenya",
    organization: "Demo Import Co",
    role: "Buyer",
  },
  {
    id: demoUuid("44444444-4444-4444-8444-", 3),
    name: "Sofia Demo",
    email: "sofia.demo@example.com",
    country: "France",
    organization: "Demo Cafe",
    role: "Cafe owner",
  },
  {
    id: demoUuid("44444444-4444-4444-8444-", 4),
    name: "Mei Demo",
    email: "mei.demo@example.com",
    country: "United States",
    organization: "Demo Coffee Lab",
    role: "Q Grader",
  },
  {
    id: demoUuid("44444444-4444-4444-8444-", 5),
    name: "Omar Demo",
    email: "omar.demo@example.com",
    country: "United Arab Emirates",
    organization: "Demo Trading",
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
      const inProgress = participant.email === "mei.demo@example.com" && session.slug === "special-process";
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
  "Soft, sweet, and easy to like. Demo comment.",
  "Juicy cup with a long finish. Demo comment.",
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
          comments: demoComment(`${seed}:comment`),
        };
      });
  });
}
