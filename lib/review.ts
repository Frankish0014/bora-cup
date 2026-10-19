import { average, distribution, emptyDistribution, type ScoreDistribution } from "@/lib/analytics";
import { formMeta } from "@/lib/forms";
import { cuppingScore, isRatingScore } from "@/lib/ratings";

export type ReviewLot = {
  id: string;
  cup: number;
  lotName: string;
  process: string | null;
  variety: string | null;
  district: string | null;
  washingStation: string | null;
};

export type ReviewScore = {
  coffeeId: string;
  rating: number | null;
  hundred: number | null;
  aroma: string | null;
  flavor: string | null;
  overall: string | null;
};

export type ReviewCupper = {
  id: string;
  name: string;
  country: string;
  organization: string | null;
  role: string | null;
  status: "in_progress" | "completed";
  formLabel: string;
  updatedAt: string | null;
  scores: ReviewScore[];
};

export type SessionReview = {
  eventName: string;
  sessionName: string;
  category: string;
  slug: string;
  lots: ReviewLot[];
  cuppers: ReviewCupper[];
};

export type ReviewRunInput = {
  id: string;
  participant_id: string;
  status: "in_progress" | "completed" | string;
  started_at: string;
  completed_at: string | null;
  form_type?: string | null;
  participants:
    | {
        id: string;
        name: string;
        country: string;
        organization: string | null;
        role: string | null;
      }
    | Array<{
        id: string;
        name: string;
        country: string;
        organization: string | null;
        role: string | null;
      }>
    | null;
};

export type ReviewEvalInput = {
  participant_session_id: string;
  coffee_lot_id: string;
  overall_score: number;
  aroma_note: string | null;
  flavor_note: string | null;
  overall_note: string | null;
  total_score?: number | null;
  updated_at: string;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function blank(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export function reportedHundred(rating: number | null, total: number | null | undefined) {
  return cuppingScore(rating, total);
}

export function latestRuns(runs: ReviewRunInput[]) {
  return [...runs]
    .sort((a, b) => b.started_at.localeCompare(a.started_at))
    .filter((run, index, list) => list.findIndex((row) => row.participant_id === run.participant_id) === index);
}

export function formSessionReview(input: {
  eventName: string;
  sessionName: string;
  category: string;
  slug: string;
  coffees: Array<{
    id: string;
    lot_name: string;
    process: string | null;
    variety: string | null;
    district: string | null;
    washing_station: string | null;
  }>;
  runs: ReviewRunInput[];
  evaluations: ReviewEvalInput[];
}): SessionReview {
  const lots: ReviewLot[] = input.coffees.map((coffee, index) => ({
    id: coffee.id,
    cup: index + 1,
    lotName: coffee.lot_name,
    process: blank(coffee.process),
    variety: blank(coffee.variety),
    district: blank(coffee.district),
    washingStation: blank(coffee.washing_station),
  }));

  const evalsByRun = new Map<string, ReviewEvalInput[]>();
  for (const evaluation of input.evaluations) {
    const list = evalsByRun.get(evaluation.participant_session_id) ?? [];
    list.push(evaluation);
    evalsByRun.set(evaluation.participant_session_id, list);
  }

  const cuppers: ReviewCupper[] = latestRuns(input.runs).flatMap((run) => {
    const person = one(run.participants);
    if (!person) return [];
    const rows = evalsByRun.get(run.id) ?? [];
    const byCoffee = new Map(rows.map((row) => [row.coffee_lot_id, row]));
    const scores = lots.map((lot) => {
      const row = byCoffee.get(lot.id);
      const rating = row && isRatingScore(row.overall_score) ? row.overall_score : row ? Number(row.overall_score) : null;
      return {
        coffeeId: lot.id,
        rating: rating != null && !Number.isNaN(rating) ? rating : null,
        hundred: row ? reportedHundred(rating, row.total_score) : null,
        aroma: blank(row?.aroma_note),
        flavor: blank(row?.flavor_note),
        overall: blank(row?.overall_note),
      } satisfies ReviewScore;
    });
    const updatedAt = rows.reduce<string | null>((latest, row) => {
      if (!latest || row.updated_at > latest) return row.updated_at;
      return latest;
    }, run.completed_at);
    return [
      {
        id: person.id,
        name: person.name,
        country: person.country,
        organization: blank(person.organization),
        role: blank(person.role),
        status: run.status === "completed" ? "completed" : "in_progress",
        formLabel: formMeta(run.form_type).short,
        updatedAt,
        scores,
      } satisfies ReviewCupper,
    ];
  });

  cuppers.sort((a, b) => a.name.localeCompare(b.name) || a.country.localeCompare(b.country));

  return {
    eventName: input.eventName,
    sessionName: input.sessionName,
    category: input.category,
    slug: input.slug,
    lots,
    cuppers,
  };
}

export function reviewSummary(review: SessionReview) {
  const official = review.cuppers.filter((cupper) => cupper.status === "completed");
  const ratings = official.flatMap((cupper) => cupper.scores.map((score) => score.rating).filter((value): value is number => value != null));
  const hundreds = official.flatMap((cupper) => cupper.scores.map((score) => score.hundred).filter((value): value is number => value != null));
  return {
    cupperCount: review.cuppers.length,
    submitted: official.length,
    ratedCount: ratings.length,
    averageHundred: average(hundreds),
    distribution: distribution(ratings),
  };
}

export function coffeeReview(review: SessionReview, lotId: string) {
  const lot = review.lots.find((item) => item.id === lotId);
  const entries = review.cuppers.flatMap((cupper) => {
    const score = cupper.scores.find((item) => item.coffeeId === lotId);
    if (!score || score.rating == null) return [];
    return [{ cupper, score }];
  });
  const official = entries.filter((entry) => entry.cupper.status === "completed");
  const ratings = official.map((entry) => entry.score.rating).filter((value): value is number => value != null);
  const hundreds = official.map((entry) => entry.score.hundred).filter((value): value is number => value != null);
  return {
    lot,
    entries,
    averageHundred: average(hundreds),
    distribution: official.length > 0 ? distribution(ratings) : emptyDistribution(),
  };
}

export function padCup(cup: number) {
  return String(cup).padStart(2, "0");
}
