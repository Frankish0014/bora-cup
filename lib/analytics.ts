import { formatNotes } from "@/lib/cupping";
import { isRatingScore, type RatingScore } from "@/lib/ratings";

export type ScoreRow = {
  coffeeId: string;
  coffeeName: string;
  sessionName: string;
  displayOrder: number;
  score: number;
  country: string;
  comment: string | null;
};

export type ScoreDistribution = Record<RatingScore, number>;

export function average(values: number[]) {
  if (values.length === 0) return null;
  const sum = values.reduce((total, value) => total + value, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

export function emptyDistribution(): ScoreDistribution {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
}

export function distribution(values: number[]): ScoreDistribution {
  const counts = emptyDistribution();
  for (const value of values) {
    if (isRatingScore(value)) counts[value] += 1;
  }
  return counts;
}

export function countBy(values: string[]) {
  const map = new Map<string, number>();
  for (const value of values) {
    const label = value.trim() || "Unknown";
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, count]) => ({ label, count }));
}

export function summarizeCoffees(rows: ScoreRow[]) {
  const groups = new Map<string, ScoreRow[]>();
  for (const row of rows) {
    const list = groups.get(row.coffeeId) ?? [];
    list.push(row);
    groups.set(row.coffeeId, list);
  }

  return [...groups.values()]
    .map((list) => ({
      coffeeId: list[0].coffeeId,
      coffeeName: list[0].coffeeName,
      sessionName: list[0].sessionName,
      displayOrder: list[0].displayOrder,
      evaluations: list.length,
      score: average(list.map((row) => row.score)),
      scoreDistribution: distribution(list.map((row) => row.score)),
      countries: countBy(list.map((row) => row.country)),
      comments: list.map((row) => formatNotes(row.comment)).filter((comment): comment is string => Boolean(comment)),
    }))
    .sort((a, b) => a.sessionName.localeCompare(b.sessionName) || a.displayOrder - b.displayOrder || a.coffeeName.localeCompare(b.coffeeName));
}
