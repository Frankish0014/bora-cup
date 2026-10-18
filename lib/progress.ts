export type ProgressCoffee = {
  id: string;
  lot_name: string;
  display_order: number;
};

export function lastReachedCoffee(ratedIds: Iterable<string>, coffees: ProgressCoffee[]) {
  const rated = new Set(ratedIds);
  return (
    coffees
      .filter((coffee) => rated.has(coffee.id))
      .sort((a, b) => a.display_order - b.display_order || a.lot_name.localeCompare(b.lot_name))
      .at(-1) ?? null
  );
}

export function runProgressLabel(input: { status: string; rated: number; total: number; lastCoffee: string | null }) {
  if (input.status === "completed") {
    return input.total > 0 ? `Submitted · ${input.rated}/${input.total}` : "Submitted";
  }
  if (input.rated === 0) return "Started · no ratings yet";
  if (input.lastCoffee) return `${input.rated}/${input.total} · last ${input.lastCoffee}`;
  return `${input.rated}/${input.total}`;
}
