import { RatingSelector } from "@/components/cupping/RatingSelector";
import { INCOMPLETE_RATINGS_MESSAGE, isDraftComplete, type Draft } from "@/lib/cupping";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

function Harness() {
  const [draft, setDraft] = useState<Draft>({ score: null, aroma: "Jasmine", flavor: "Cocoa", overall: "Sweet" });
  const [message, setMessage] = useState<string | null>(null);
  return (
    <div>
      <RatingSelector label="Rating" value={draft.score} onChange={(score) => setDraft((current) => ({ ...current, score }))} />
      <button
        type="button"
        onClick={() => {
          if (!isDraftComplete(draft)) setMessage(INCOMPLETE_RATINGS_MESSAGE);
          else setMessage("saved");
        }}
      >
        Save & next
      </button>
      {message ? <p role="alert">{message}</p> : null}
    </div>
  );
}

describe("RatingSelector", () => {
  afterEach(() => cleanup());

  it("shows the five labels and blocks an incomplete coffee", () => {
    render(<Harness />);
    expect(screen.getAllByText("OK").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Take My Money").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Save & next" }));
    expect(screen.getByRole("alert").textContent).toContain("Please complete aroma, flavor, overall, and the rating before continuing.");
  });

  it("keeps a selected score", () => {
    render(<Harness />);
    const rating = screen.getByRole("radio", { name: /Excellent/ });
    fireEvent.click(rating);
    expect((rating as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Save & next" }));
    expect(screen.getByRole("alert").textContent).toContain("saved");
  });
});
