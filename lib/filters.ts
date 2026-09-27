export type EvaluationFilters = {
  eventId?: string;
  sessionId?: string;
  coffeeId?: string;
  country?: string;
  participant?: string;
  from?: string;
  to?: string;
  page: number;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function sanitizeSearch(value: string) {
  return value.replace(/[%_,.()]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function parseEvaluationFilters(input: Record<string, string | string[] | undefined>): EvaluationFilters {
  const eventId = first(input.event);
  const sessionId = first(input.session);
  const coffeeId = first(input.coffee);
  const country = first(input.country)?.trim();
  const participant = sanitizeSearch(first(input.participant) ?? "");
  const from = first(input.from);
  const to = first(input.to);
  const pageRaw = Number(first(input.page) ?? "1");

  return {
    eventId: eventId && UUID.test(eventId) ? eventId : undefined,
    sessionId: sessionId && UUID.test(sessionId) ? sessionId : undefined,
    coffeeId: coffeeId && UUID.test(coffeeId) ? coffeeId : undefined,
    country: country ? country.slice(0, 80) : undefined,
    participant: participant || undefined,
    from: from && DATE.test(from) ? from : undefined,
    to: to && DATE.test(to) ? to : undefined,
    page: Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1,
  };
}

export function filtersToQuery(filters: EvaluationFilters, overrides: Partial<EvaluationFilters> = {}) {
  const next = { ...filters, ...overrides };
  const params = new URLSearchParams();
  if (next.eventId) params.set("event", next.eventId);
  if (next.sessionId) params.set("session", next.sessionId);
  if (next.coffeeId) params.set("coffee", next.coffeeId);
  if (next.country) params.set("country", next.country);
  if (next.participant) params.set("participant", next.participant);
  if (next.from) params.set("from", next.from);
  if (next.to) params.set("to", next.to);
  if (next.page > 1) params.set("page", String(next.page));
  const query = params.toString();
  return query ? `?${query}` : "";
}
