import { describe, expect, it } from "vitest";
import { thanksEmail, welcomeEmail } from "@/lib/email";

const mail = {
  to: "aline@example.com",
  name: "Aline Uwase",
  eventName: "Best of Rwanda Cup Tour 2026",
  sessionName: "Fully Washed",
  cupCount: 9,
};

describe("session emails", () => {
  it("welcomes the cupper to this session", () => {
    const email = welcomeEmail(mail);
    expect(email.subject).toBe("Welcome to Fully Washed");
    expect(email.text).toContain("Hi Aline");
    expect(email.text).toContain("9 cups");
    expect(email.text).toContain("Cup 1");
    expect(email.html).toContain("Fully Washed");
  });

  it("thanks them after submit", () => {
    const email = thanksEmail(mail);
    expect(email.subject).toBe("Thank you for cupping Fully Washed");
    expect(email.text).toContain("Your notes and ratings are saved");
    expect(email.text).toContain("same email");
  });
});
