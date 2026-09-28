import { z } from "zod";
import { isCountry } from "@/lib/countries";
import { COMMENT_MAX_LENGTH } from "@/lib/cupping";
import { isSlug } from "@/lib/utils";

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z
      .string()
      .trim()
      .max(max)
      .transform((value) => (value.length > 0 ? value : null)),
  );

const optionalDate = z.preprocess(
  (value) => (typeof value === "string" ? value : ""),
  z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "Enter a valid date.")
    .transform((value) => (value.length > 0 ? value : null)),
);

export const participantSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120, "Name is too long."),
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email address.")
    .max(254)
    .transform((value) => value.toLowerCase()),
  country: z
    .string()
    .trim()
    .min(1, "Country is required.")
    .refine(isCountry, "Select a country."),
  organization: optionalText(120),
  role: optionalText(120),
});

const note = z
  .string()
  .trim()
  .min(1, "This note is required.")
  .max(COMMENT_MAX_LENGTH, "Comments must be 300 characters or fewer.");

const cuppingNotesSchema = z.object({
  coffeeLotId: z.string().uuid(),
  score: z.number().int().min(1).max(5),
  aroma: note,
  flavor: note,
  overall: note,
});

export const sessionSubmissionSchema = z.object({
  participantSessionId: z.string().uuid(),
  evaluations: z.array(cuppingNotesSchema).min(1),
});

export const evaluationSchema = z.object({
  participantSessionId: z.string().uuid(),
  coffeeLotId: z.string().uuid(),
  score: z.number().int().min(1).max(5),
  aroma: note,
  flavor: note,
  overall: note,
});

export const eventSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required.").max(160),
    description: optionalText(2000),
    start_date: optionalDate,
    end_date: optionalDate,
    active: z.boolean(),
  })
  .refine((value) => !value.start_date || !value.end_date || value.end_date >= value.start_date, {
    message: "End date must be on or after the start date.",
    path: ["end_date"],
  });

export const sessionSchema = z.object({
  event_id: z.string().uuid("Choose an event."),
  name: z.string().trim().min(1, "Session name is required.").max(120),
  category: z.string().trim().min(1, "Category is required.").max(80),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .max(80)
    .refine(isSlug, "Use lowercase letters, numbers, and hyphens."),
  description: optionalText(2000),
  active: z.boolean(),
});

export const coffeeSchema = z.object({
  session_id: z.string().uuid("Choose a session."),
  lot_name: z.string().trim().min(1, "Lot name is required.").max(160),
  lot_number: optionalText(80),
  cupping_code: optionalText(80),
  washing_station: optionalText(160),
  district: optionalText(120),
  country: optionalText(80),
  variety: optionalText(120),
  process: optionalText(120),
  altitude: optionalText(80),
  harvest: optionalText(80),
  producer: optionalText(160),
  cooperative: optionalText(160),
  description: optionalText(2000),
  display_order: z.number().int().min(0).max(9999),
  active: z.boolean(),
});

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export function zodFieldErrors(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}
