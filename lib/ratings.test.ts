import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { average, distribution, summarizeCoffees } from "@/lib/analytics";
import { visibleCoffeeFields } from "@/lib/coffee";
import { CSV_COLUMNS, toCsv } from "@/lib/csv";
import { INCOMPLETE_RATINGS_MESSAGE, formatNotes, isDraftComplete, nextIndex, previousIndex } from "@/lib/cupping";
import { buildDemoCoffees, buildDemoEvaluations, demoScore } from "@/database/demo-data";
import { parseEvaluationFilters, sanitizeSearch } from "@/lib/filters";
import { RATING_OPTIONS, formatAverage, ratingLabel, ratingScale, scoreOutOf100 } from "@/lib/ratings";
import { addResumeToken, parseResumeTokens } from "@/lib/resume";
import { safeAdminPath, slugify } from "@/lib/utils";
import { participantSchema } from "@/lib/validations";

describe("rating scale", () => {
  it("uses the exact cupping labels", () => {
    expect(RATING_OPTIONS.map((option) => option.score)).toEqual([1, 2, 3, 4, 5]);
    expect(RATING_OPTIONS.map((option) => option.label)).toEqual(["OK", "Good", "Very Good", "Excellent", "Take My Money"]);
    expect(ratingLabel(5)).toBe("5 — Take My Money");
    expect(ratingScale(4)).toBe("Excellent");
    expect(ratingScale(5)).toBe("Take My Money");
    expect(scoreOutOf100(1)).toBe(20);
    expect(scoreOutOf100(2)).toBe(40);
    expect(scoreOutOf100(3)).toBe(60);
    expect(scoreOutOf100(4)).toBe(80);
    expect(scoreOutOf100(5)).toBe(100);
    expect(scoreOutOf100(4.33)).toBe(86.6);
    expect(formatAverage(3.17)).toBe("63.4");
    expect(formatAverage(null)).toBe("—");
  });
});

describe("participant validation", () => {
  it("accepts a valid participant", () => {
    const result = participantSchema.safeParse({
      name: "Aline Demo",
      email: "Aline@Example.com",
      country: "Rwanda",
      organization: "",
      role: "Roaster",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("aline@example.com");
  });

  it("rejects an invalid email, missing name, and missing country", () => {
    const result = participantSchema.safeParse({ name: " ", email: "not-an-email", country: "", organization: "", role: "" });
    expect(result.success).toBe(false);
  });
});

describe("cupping navigation", () => {
  it("requires one rating before continuing", () => {
    expect(INCOMPLETE_RATINGS_MESSAGE).toBe("Please complete aroma, flavor, overall, and the rating for every coffee before saving.");
    expect(isDraftComplete({ score: null, aroma: "floral", flavor: "cocoa", overall: "sweet" })).toBe(false);
    expect(isDraftComplete({ score: 5, aroma: "", flavor: "", overall: "" })).toBe(false);
    expect(isDraftComplete({ score: 5, aroma: "floral", flavor: "cocoa", overall: "sweet" })).toBe(true);
  });

  it("formats aroma, flavor, and overall from their own fields", () => {
    expect(formatNotes({ aroma: "Jasmine", flavor: "Cocoa", overall: "Sweet and long" })).toBe("Aroma: Jasmine\nFlavor: Cocoa\nOverall: Sweet and long");
    expect(formatNotes({ aroma: "  ", flavor: "", overall: "" })).toBeNull();
  });

  it("moves between coffees without leaving the range", () => {
    expect(previousIndex(0)).toBe(0);
    expect(nextIndex(6, 7)).toBe(6);
    expect(nextIndex(1, 7)).toBe(2);
  });
});

describe("coffee fields", () => {
  it("hides empty fields", () => {
    const fields = visibleCoffeeFields({
      lot_name: "Fully Washed #1",
      cupping_code: "BORA-FW-001",
      producer: "  ",
      district: "Demo District",
    });
    expect(fields.map((field) => field.label)).toEqual(["Cupping Code", "District"]);
  });
});

describe("helpers", () => {
  it("suggests a session slug", () => {
    expect(slugify("Special Process")).toBe("special-process");
  });

  it("keeps admin redirects inside the admin area", () => {
    expect(safeAdminPath("/admin/coffees")).toBe("/admin/coffees");
    expect(safeAdminPath("https://evil.example")).toBe("/admin/dashboard");
    expect(safeAdminPath("//evil.example")).toBe("/admin/dashboard");
  });

  it("stores a few resume tokens", () => {
    const token = "66666666-6666-4666-8666-000000000001";
    expect(parseResumeTokens(addResumeToken(undefined, token))).toEqual([token]);
    expect(parseResumeTokens("not-a-token")).toEqual([]);
  });

  it("sanitizes evaluation filters", () => {
    const filters = parseEvaluationFilters({ participant: "a%,_drop", page: "2", from: "2026-09-01" });
    expect(filters.participant).toBe("a drop");
    expect(filters.page).toBe(2);
    expect(filters.from).toBe("2026-09-01");
    expect(sanitizeSearch("%")).toBe("");
  });
});

describe("analytics and csv", () => {
  it("averages scores and counts the distribution", () => {
    expect(average([5, 4, 4])).toBe(4.33);
    expect(distribution([1, 5, 5])[5]).toBe(2);
    const [summary] = summarizeCoffees([
      { coffeeId: "c1", coffeeName: "Fully Washed #1", sessionName: "Fully Washed", displayOrder: 1, score: 4, country: "Rwanda", aroma: "Jasmine", flavor: "Cocoa", overall: "Very clean and sweet." },
      { coffeeId: "c1", coffeeName: "Fully Washed #1", sessionName: "Fully Washed", displayOrder: 1, score: 2, country: "Kenya", aroma: null, flavor: null, overall: null },
    ]);
    expect(summary.evaluations).toBe(2);
    expect(summary.score).toBe(3);
    expect(summary.comments).toEqual(["Aroma: Jasmine\nFlavor: Cocoa\nOverall: Very clean and sweet."]);
  });

  it("exports the required columns and neutralizes spreadsheet formulas", () => {
    const csv = toCsv([
      {
        "Participant Name": "=cmd",
        Email: "a@example.com",
        Country: "Rwanda",
        Organization: null,
        Role: null,
        Event: "Best of Rwanda Cup Tour 2026",
        Session: "Fully Washed",
        "Coffee Name": "Fully Washed #1",
        "Lot Number": "FW-001",
        "Cupping Code": "BORA-FW-001",
        "Washing Station": "Demo Washing Station",
        District: "Demo District",
        Variety: "Red Bourbon",
        Process: "Fully Washed",
        Altitude: "1,900 MASL",
        Harvest: "2026",
        "Score / 100": 80,
        Rating: "Excellent",
        Aroma: "Jasmine",
        Flavor: "Cocoa",
        Overall: 'He said "clean"',
        "Submitted At": "2026-09-20T11:30:00.000Z",
      },
    ]);
    expect(csv.startsWith("\uFEFFParticipant Name,Email,Country")).toBe(true);
    expect(CSV_COLUMNS).toHaveLength(22);
    expect(csv).toContain("Score / 100,Rating,Aroma,Flavor,Overall");
    expect(csv).toContain("80,Excellent,Jasmine");
    expect(csv).toContain("'=cmd");
    expect(csv).toContain('"He said ""clean"""');
  });
});

describe("demo data and schema", () => {
  it("seeds 7 fully washed and 18 special process coffees", () => {
    const coffees = buildDemoCoffees();
    expect(coffees.filter((coffee) => coffee.lot_name.startsWith("Fully Washed"))).toHaveLength(7);
    expect(coffees.filter((coffee) => coffee.lot_name.startsWith("Special Process"))).toHaveLength(18);
    expect(coffees[0]).toMatchObject({
      lot_number: "FW-001",
      cupping_code: "BORA-FW-001",
      washing_station: "Demo Washing Station",
      district: "Demo District",
      variety: "Red Bourbon",
      process: "Fully Washed",
      altitude: "1,900 MASL",
    });
    expect(demoScore("anything")).toBeGreaterThanOrEqual(1);
    expect(demoScore("anything")).toBeLessThanOrEqual(5);
    expect(buildDemoEvaluations().length).toBeGreaterThan(0);
  });

  it("locks down evaluations in the migration", () => {
    const sql = readFileSync("supabase/migrations/20260926120000_init.sql", "utf8");
    expect(sql).toContain("unique (participant_session_id, coffee_lot_id)");
    expect(sql).toContain("aroma_score between 1 and 5");
    expect(sql).toContain("enable row level security");
    expect(sql).toContain("revoke all on table public.evaluations from anon");
    expect(sql).not.toContain("on public.evaluations\nfor insert\nto anon");
  });
});
