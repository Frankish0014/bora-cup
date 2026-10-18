import { describe, expect, it } from "vitest";
import { addResumeToken, parseResumeTokens, removeResumeToken } from "@/lib/resume";

const a = "11111111-1111-4111-8111-111111111111";
const b = "22222222-2222-4222-8222-222222222222";

describe("resume tokens", () => {
  it("adds the newest token first", () => {
    expect(parseResumeTokens(addResumeToken(a, b))).toEqual([b, a]);
  });

  it("removes a token when the cupper leaves the table", () => {
    expect(removeResumeToken(`${a}.${b}`, a)).toBe(b);
    expect(removeResumeToken(a, a)).toBe("");
  });
});
