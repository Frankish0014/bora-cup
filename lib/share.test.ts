import { describe, expect, it } from "vitest";
import { isValidShareToken, sessionShareToken, SHARE_TOKEN_LENGTH, sharePaths } from "@/lib/share";

describe("sessionShareToken", () => {
  it("is stable for the same session", () => {
    expect(sessionShareToken("session-a")).toBe(sessionShareToken("session-a"));
  });

  it("differs across sessions", () => {
    expect(sessionShareToken("session-a")).not.toBe(sessionShareToken("session-b"));
  });

  it("is a short url-safe token", () => {
    const token = sessionShareToken("session-a");
    expect(token).toHaveLength(SHARE_TOKEN_LENGTH);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe("isValidShareToken", () => {
  it("accepts the matching token", () => {
    const token = sessionShareToken("session-a");
    expect(isValidShareToken("session-a", token)).toBe(true);
  });

  it("rejects a token from another session", () => {
    const token = sessionShareToken("session-b");
    expect(isValidShareToken("session-a", token)).toBe(false);
  });

  it("rejects a short or empty value", () => {
    expect(isValidShareToken("session-a", "")).toBe(false);
    expect(isValidShareToken("session-a", "nope")).toBe(false);
  });
});

describe("sharePaths", () => {
  it("puts the token on review and table urls", () => {
    const paths = sharePaths("fully-washed", "session-a");
    expect(paths.review).toBe(`/review/fully-washed/${paths.token}`);
    expect(paths.table).toBe(`/table/fully-washed/${paths.token}`);
  });
});
