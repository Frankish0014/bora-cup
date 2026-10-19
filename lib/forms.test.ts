import { describe, expect, it } from "vitest";
import { coeTotal, isDraftComplete, preferenceFromTotal, scaTotal, emptyDraft, syncDraft } from "@/lib/forms";

describe("form scoring", () => {
  it("totals an SCA sheet and maps it onto the 1–5 preference scale", () => {
    const payload = {
      fragrance: 8,
      flavor: 8,
      aftertaste: 8,
      acidity: 8,
      body: 8,
      uniformity: 10,
      balance: 8,
      cleanCup: 10,
      sweetness: 10,
      overall: 8,
      taintCups: 0,
      faultCups: 0,
    };
    expect(scaTotal(payload)).toBe(86);
    expect(preferenceFromTotal(86)).toBe(3);
    expect(preferenceFromTotal(89)).toBe(4);
    expect(preferenceFromTotal(99)).toBe(5);
  });

  it("adds the Cup of Excellence base of 36", () => {
    expect(
      coeTotal({
        cleanCup: 8,
        sweetness: 7,
        acidity: 7,
        mouthfeel: 6,
        flavour: 7,
        aftertaste: 6,
        balance: 7,
        overall: 7,
      }),
    ).toBe(91);
  });

  it("treats the Bora sheet as complete once a rating is chosen", () => {
    const draft = emptyDraft("bora");
    expect(isDraftComplete(draft)).toBe(false);
    expect(isDraftComplete({ ...draft, score: 4 })).toBe(true);
  });

  it("fills a derived total on the Bora sheet", () => {
    expect(syncDraft({ ...emptyDraft("bora"), score: 5 }).total).toBe(99);
    expect(syncDraft({ ...emptyDraft("bora"), score: 3 }).total).toBe(87);
  });
});
