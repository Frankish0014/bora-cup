import { describe, expect, it } from "vitest";
import { canJoinTable, tableAcceptsNewCuppers } from "@/lib/session-room";

describe("table joining", () => {
  it("stays open until an organizer closes it", () => {
    expect(tableAcceptsNewCuppers(undefined)).toBe(true);
    expect(tableAcceptsNewCuppers(true)).toBe(true);
    expect(tableAcceptsNewCuppers(false)).toBe(false);
  });

  it("lets people already on the sheet continue after the table is closed", () => {
    expect(canJoinTable(false, false)).toBe(false);
    expect(canJoinTable(false, true)).toBe(true);
    expect(canJoinTable(true, false)).toBe(true);
  });
});
