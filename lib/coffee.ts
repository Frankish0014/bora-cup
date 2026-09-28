export type CoffeeFields = {
  lot_name: string;
  lot_number?: string | null;
  cupping_code?: string | null;
  washing_station?: string | null;
  district?: string | null;
  country?: string | null;
  variety?: string | null;
  process?: string | null;
  altitude?: string | null;
  harvest?: string | null;
  producer?: string | null;
  cooperative?: string | null;
  description?: string | null;
  photo_url?: string | null;
};

const FIELD_DEFS = [
  ["cupping_code", "Cupping Code"],
  ["lot_number", "Lot Number"],
  ["washing_station", "Washing Station"],
  ["district", "District"],
  ["country", "Country"],
  ["variety", "Variety"],
  ["process", "Process"],
  ["altitude", "Altitude"],
  ["harvest", "Harvest"],
  ["producer", "Producer"],
  ["cooperative", "Cooperative"],
  ["description", "Notes"],
] as const;

export function visibleCoffeeFields(lot: CoffeeFields) {
  return FIELD_DEFS.flatMap(([key, label]) => {
    const value = lot[key];
    if (typeof value !== "string" || value.trim().length === 0) return [];
    return [{ key, label, value: value.trim() }];
  });
}
