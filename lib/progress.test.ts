import { describe, expect, it } from "vitest";
import { lastReachedCoffee, runProgressLabel } from "@/lib/progress";

const coffees = [
  { id: "a", lot_name: "Fully Washed #1", display_order: 1 },
  { id: "b", lot_name: "Fully Washed #2", display_order: 2 },
  { id: "c", lot_name: "Fully Washed #7", display_order: 7 },
];

describe("lastReachedCoffee", () => {
  it("returns the farthest rated lot in cupping order", () => {
    expect(lastReachedCoffee(["a", "c"], coffees)?.lot_name).toBe("Fully Washed #7");
  });

  it("returns null when nothing is rated", () => {
    expect(lastReachedCoffee([], coffees)).toBeNull();
  });
});

describe("runProgressLabel", () => {
  it("shows where an unfinished cupper stopped", () => {
    expect(runProgressLabel({ status: "in_progress", rated: 7, total: 15, lastCoffee: "Fully Washed #7" })).toBe(
      "7/15 · last Fully Washed #7",
    );
  });

  it("marks a started run with no scores", () => {
    expect(runProgressLabel({ status: "in_progress", rated: 0, total: 15, lastCoffee: null })).toBe("Started · no ratings yet");
  });
});
