import { describe, expect, it } from "vitest";
import { coffeeReview, formSessionReview, latestRuns, padCup, reportedHundred, reviewSummary } from "@/lib/review";

const coffees = [
  { id: "lot-1", lot_name: "Fully Washed #1", process: "Washed", variety: "Bourbon", district: "Nyamasheke", washing_station: "Kibuye" },
  { id: "lot-2", lot_name: "Fully Washed #2", process: "Washed", variety: null, district: null, washing_station: null },
];

const person = (id: string, name: string) => ({ id, name, country: "Rwanda", organization: "NAEB", role: "Cupper" });

describe("reportedHundred", () => {
  it("uses the form total when present", () => {
    expect(reportedHundred(4, 87.5)).toBe(87.5);
  });

  it("scales a 1–5 rating when there is no form total", () => {
    expect(reportedHundred(5, null)).toBe(100);
    expect(reportedHundred(1, null)).toBe(20);
  });
});

describe("latestRuns", () => {
  it("keeps the newest run per cupper", () => {
    const latest = latestRuns([
      { id: "old", participant_id: "p1", status: "completed", started_at: "2026-01-01T00:00:00Z", completed_at: "2026-01-01T01:00:00Z", participants: person("p1", "Aline") },
      { id: "new", participant_id: "p1", status: "in_progress", started_at: "2026-01-02T00:00:00Z", completed_at: null, participants: person("p1", "Aline") },
    ]);
    expect(latest).toHaveLength(1);
    expect(latest[0].id).toBe("new");
  });
});

describe("formSessionReview", () => {
  const review = formSessionReview({
    eventName: "Best of Rwanda",
    sessionName: "Fully Washed",
    category: "Fully washed",
    slug: "fully-washed",
    coffees,
    runs: [
      { id: "run-1", participant_id: "p1", status: "completed", started_at: "2026-01-01T00:00:00Z", completed_at: "2026-01-01T01:00:00Z", form_type: "bora", participants: person("p1", "Aline") },
      { id: "run-2", participant_id: "p2", status: "in_progress", started_at: "2026-01-01T02:00:00Z", completed_at: null, form_type: "bora", participants: person("p2", "Jean") },
    ],
    evaluations: [
      { participant_session_id: "run-1", coffee_lot_id: "lot-1", overall_score: 5, aroma_note: "Floral", flavor_note: null, overall_note: null, total_score: null, updated_at: "2026-01-01T00:30:00Z" },
      { participant_session_id: "run-1", coffee_lot_id: "lot-2", overall_score: 3, aroma_note: null, flavor_note: "Citrus", overall_note: "Clean", total_score: null, updated_at: "2026-01-01T00:40:00Z" },
      { participant_session_id: "run-2", coffee_lot_id: "lot-1", overall_score: 4, aroma_note: null, flavor_note: null, overall_note: null, total_score: null, updated_at: "2026-01-01T02:10:00Z" },
    ],
  });

  it("numbers cups in table order", () => {
    expect(review.lots.map((lot) => `${lot.cup}:${lot.lotName}`)).toEqual(["1:Fully Washed #1", "2:Fully Washed #2"]);
  });

  it("sorts cuppers by name and keeps empty cups", () => {
    expect(review.cuppers.map((cupper) => cupper.name)).toEqual(["Aline", "Jean"]);
    expect(review.cuppers[1].scores[1].rating).toBeNull();
  });

  it("summarises ratings without treating missing cups as zero", () => {
    const summary = reviewSummary(review);
    expect(summary.cupperCount).toBe(2);
    expect(summary.submitted).toBe(1);
    expect(summary.ratedCount).toBe(2);
    expect(summary.averageHundred).toBe(80);
  });

  it("groups notes under the matching coffee", () => {
    const first = coffeeReview(review, "lot-1");
    expect(first.entries).toHaveLength(2);
    expect(first.averageHundred).toBe(100);
    expect(first.entries[0].score.aroma).toBe("Floral");
  });

  it("keeps in-progress notes visible without using them in the average", () => {
    const first = coffeeReview(review, "lot-1");
    expect(first.entries.map((entry) => entry.cupper.name)).toEqual(["Aline", "Jean"]);
    expect(first.averageHundred).toBe(100);
  });
});

describe("padCup", () => {
  it("keeps cup numbers aligned", () => {
    expect(padCup(1)).toBe("01");
    expect(padCup(12)).toBe("12");
  });
});
