import { isRatingScore, scoreOutOf100 } from "@/lib/ratings";

export const FORM_TYPES = [
  {
    id: "bora",
    name: "Bora Cupping Sheet",
    short: "Bora",
    summary: "One required rating from OK (80–84) to Take My Money (99+), with optional aroma, flavor, and overall notes.",
  },
  {
    id: "sca_traditional",
    name: "SCA Arabica Cupping Form",
    short: "SCA Traditional",
    summary: "Classic 100-point specialty form. Attributes from 6.00 to 10.00, with defect deductions.",
  },
  {
    id: "sca_cva",
    name: "SCA Coffee Value Assessment",
    short: "SCA CVA",
    summary: "Descriptive intensities, check-all-that-apply flavors, and a 9-point preference. Selected fields average into the lot score.",
  },
  {
    id: "coe",
    name: "Cup of Excellence Scoresheet",
    short: "Cup of Excellence",
    summary: "Starts at 0. The 36-point base is added with the first attribute, then each score from 0 to 8 adds on.",
  },
  {
    id: "roastery",
    name: "Roastery Scorecard",
    short: "Roastery",
    summary: "Streamlined importer and roaster card: fragrance, flavor, acidity, body, aftertaste, and overall.",
  },
] as const;

export type FormTypeId = (typeof FORM_TYPES)[number]["id"];
export const FORM_TYPE_IDS = ["bora", "sca_traditional", "sca_cva", "coe", "roastery"] as const;

export function isFormType(value: unknown): value is FormTypeId {
  return typeof value === "string" && (FORM_TYPE_IDS as readonly string[]).includes(value);
}

export function formMeta(id: FormTypeId | string | null | undefined) {
  return FORM_TYPES.find((form) => form.id === id) ?? FORM_TYPES[0];
}

export type FormPolicy = "locked" | "choice";

export function isFormPolicy(value: unknown): value is FormPolicy {
  return value === "locked" || value === "choice";
}

export type CuppingDraft = {
  formType: FormTypeId;
  score: number | null;
  aroma: string;
  flavor: string;
  overall: string;
  total: number | null;
  payload: Record<string, unknown>;
};

export function emptyDraft(formType: FormTypeId = "bora"): CuppingDraft {
  return { formType, score: null, aroma: "", flavor: "", overall: "", total: null, payload: {} };
}

export function preferenceFromTotal(total: number | null | undefined): 1 | 2 | 3 | 4 | 5 | null {
  if (total == null || Number.isNaN(total)) return null;
  if (total >= 90) return 5;
  if (total >= 88) return 4;
  if (total >= 86) return 3;
  if (total >= 84) return 2;
  if (total >= 1) return 1;
  return null;
}

const SCA_KEYS = ["fragrance", "flavor", "aftertaste", "acidity", "body", "uniformity", "balance", "cleanCup", "sweetness", "overall"] as const;
export const SCA_ATTRIBUTES: Array<{ key: (typeof SCA_KEYS)[number]; label: string; hint: string }> = [
  { key: "fragrance", label: "Fragrance / Aroma", hint: "Dry and wet" },
  { key: "flavor", label: "Flavor", hint: "6.00 to 10.00" },
  { key: "aftertaste", label: "Aftertaste", hint: "6.00 to 10.00" },
  { key: "acidity", label: "Acidity", hint: "6.00 to 10.00" },
  { key: "body", label: "Body", hint: "Mouthfeel" },
  { key: "uniformity", label: "Uniformity", hint: "2 points per uniform cup" },
  { key: "balance", label: "Balance", hint: "6.00 to 10.00" },
  { key: "cleanCup", label: "Clean cup", hint: "2 points per clean cup" },
  { key: "sweetness", label: "Sweetness", hint: "2 points per sweet cup" },
  { key: "overall", label: "Overall", hint: "6.00 to 10.00" },
];

export const CVA_INTENSITIES: Array<{ key: string; label: string }> = [
  { key: "fragrance", label: "Fragrance" },
  { key: "aroma", label: "Aroma" },
  { key: "flavor", label: "Flavor" },
  { key: "aftertaste", label: "Aftertaste" },
  { key: "acidity", label: "Acidity" },
  { key: "sweetness", label: "Sweetness" },
  { key: "mouthfeel", label: "Mouthfeel" },
];

export const CVA_TAGS = [
  "Floral",
  "Fruity",
  "Citrus",
  "Berry",
  "Stone fruit",
  "Tropical",
  "Dried fruit",
  "Cocoa",
  "Nutty",
  "Caramel",
  "Honey",
  "Vanilla",
  "Spice",
  "Tea-like",
  "Herbal",
  "Roasted",
  "Fermented",
  "Sour",
  "Earthy",
  "Papery",
];

export const COE_ATTRIBUTES: Array<{ key: string; label: string }> = [
  { key: "cleanCup", label: "Clean cup" },
  { key: "sweetness", label: "Sweetness" },
  { key: "acidity", label: "Acidity" },
  { key: "mouthfeel", label: "Mouthfeel" },
  { key: "flavour", label: "Flavour" },
  { key: "aftertaste", label: "Aftertaste" },
  { key: "balance", label: "Balance" },
  { key: "overall", label: "Overall" },
];

export const ROASTERY_ATTRIBUTES: Array<{ key: string; label: string }> = [
  { key: "fragrance", label: "Fragrance / Aroma" },
  { key: "flavor", label: "Flavor" },
  { key: "acidity", label: "Acidity" },
  { key: "body", label: "Body" },
  { key: "aftertaste", label: "Aftertaste" },
  { key: "overall", label: "Overall" },
];

function num(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function hasNumeric(payload: Record<string, unknown>, keys: readonly string[]) {
  return keys.some((key) => num(payload, key) != null);
}

export function scaTotal(payload: Record<string, unknown>) {
  if (!hasNumeric(payload, [...SCA_KEYS, "taintCups", "faultCups"])) return 0;
  const attributes = SCA_KEYS.reduce((sum, key) => sum + (num(payload, key) ?? 0), 0);
  const taints = Math.max(0, Math.round(num(payload, "taintCups") ?? 0));
  const faults = Math.max(0, Math.round(num(payload, "faultCups") ?? 0));
  return Math.round((attributes - taints * 2 - faults * 4) * 100) / 100;
}

export function coeTotal(payload: Record<string, unknown>) {
  if (!hasNumeric(payload, COE_ATTRIBUTES.map((item) => item.key))) return 0;
  const attributes = COE_ATTRIBUTES.reduce((sum, item) => sum + (num(payload, item.key) ?? 0), 0);
  return Math.round((36 + attributes) * 100) / 100;
}

export function roasteryTotal(payload: Record<string, unknown>) {
  const values = ROASTERY_ATTRIBUTES.map((item) => num(payload, item.key)).filter((value): value is number => value != null);
  if (values.length === 0) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10 * 10) / 10;
}

/** Selected intensities and preference each scale to 100, then average. Empty stays 0. */
export function cvaTotal(payload: Record<string, unknown>) {
  const parts: number[] = [];
  for (const item of CVA_INTENSITIES) {
    const value = num(payload, item.key);
    if (value != null) parts.push((value / 15) * 100);
  }
  const hedonic = num(payload, "hedonic");
  if (hedonic != null) parts.push((hedonic / 9) * 100);
  if (parts.length === 0) return 0;
  return Math.round((parts.reduce((sum, value) => sum + value, 0) / parts.length) * 10) / 10;
}

export function draftTotal(draft: CuppingDraft) {
  if (draft.formType === "bora") return draft.score != null ? scoreOutOf100(draft.score) : null;
  if (draft.formType === "sca_traditional") return scaTotal(draft.payload);
  if (draft.formType === "coe") return coeTotal(draft.payload);
  if (draft.formType === "roastery") return roasteryTotal(draft.payload);
  if (draft.formType === "sca_cva") return cvaTotal(draft.payload);
  return null;
}

export function draftScore(draft: CuppingDraft) {
  if (draft.formType === "bora") return isRatingScore(draft.score) ? draft.score : null;
  return preferenceFromTotal(draftTotal(draft));
}

export function isDraftComplete(draft: CuppingDraft | undefined) {
  if (!draft) return false;
  if (draft.formType === "bora") return isRatingScore(draft.score);
  if (draft.formType === "sca_traditional") return SCA_KEYS.every((key) => num(draft.payload, key) != null);
  if (draft.formType === "coe") return COE_ATTRIBUTES.every((item) => num(draft.payload, item.key) != null);
  if (draft.formType === "roastery") return ROASTERY_ATTRIBUTES.every((item) => num(draft.payload, item.key) != null);
  if (draft.formType === "sca_cva") return num(draft.payload, "hedonic") != null;
  return false;
}

export function syncDraft(draft: CuppingDraft): CuppingDraft {
  const total = draftTotal(draft);
  return { ...draft, total, score: draft.formType === "bora" ? draft.score : preferenceFromTotal(total) };
}

const NOTE_MAX = 300;

export function clipNote(value: string | null | undefined) {
  const text = value?.trim() ?? "";
  if (!text) return "";
  return text.slice(0, NOTE_MAX);
}
