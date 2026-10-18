export const RWANDA_PROVINCES = ["Kigali City", "Northern", "Southern", "Western", "Eastern"] as const;

export const RWANDA_DISTRICTS: Record<(typeof RWANDA_PROVINCES)[number], string[]> = {
  "Kigali City": ["Gasabo", "Kicukiro", "Nyarugenge"],
  Northern: ["Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo"],
  Southern: ["Gisagara", "Huye", "Kamonyi", "Muhanga", "Nyamagabe", "Nyanza", "Nyaruguru", "Ruhango"],
  Western: ["Karongi", "Ngororero", "Nyabihu", "Nyamasheke", "Rubavu", "Rusizi", "Rutsiro"],
  Eastern: ["Bugesera", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Nyagatare", "Rwamagana"],
};

const DISTRICT_TO_PROVINCE = Object.fromEntries(
  RWANDA_PROVINCES.flatMap((province) => RWANDA_DISTRICTS[province].map((district) => [district.toLowerCase(), province])),
) as Record<string, (typeof RWANDA_PROVINCES)[number]>;

export function provinceForDistrict(district: string | null | undefined) {
  if (!district) return null;
  return DISTRICT_TO_PROVINCE[district.trim().toLowerCase()] ?? null;
}

export function resolveProvince(lot: { province?: string | null; district?: string | null }) {
  const written = lot.province?.trim();
  if (written) return written;
  return provinceForDistrict(lot.district) ?? null;
}

export function allRwandaDistricts() {
  return RWANDA_PROVINCES.flatMap((province) => RWANDA_DISTRICTS[province].map((district) => ({ province, district })));
}
