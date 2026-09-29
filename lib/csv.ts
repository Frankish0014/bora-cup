export const CSV_COLUMNS = [
  "Participant Name",
  "Email",
  "Country",
  "Organization",
  "Role",
  "Event",
  "Session",
  "Coffee Name",
  "Lot Number",
  "Cupping Code",
  "Washing Station",
  "District",
  "Variety",
  "Process",
  "Altitude",
  "Harvest",
  "Score / 100",
  "Rating",
  "Aroma",
  "Flavor",
  "Overall",
  "Submitted At",
] as const;

export type CsvColumn = (typeof CSV_COLUMNS)[number];
export type CsvRow = Record<CsvColumn, string | number | null | undefined>;

function escapeCell(value: string | number | null | undefined) {
  if (value == null) return "";
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCsv(rows: CsvRow[]) {
  const header = CSV_COLUMNS.join(",");
  const lines = rows.map((row) => CSV_COLUMNS.map((column) => escapeCell(row[column])).join(","));
  return `\uFEFF${[header, ...lines].join("\r\n")}`;
}
