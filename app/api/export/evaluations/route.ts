import { getAdminUser } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { evaluationToCsvRow, getEvaluationsForExport } from "@/lib/data/admin";
import { AuthError, ConfigError } from "@/lib/errors";
import { parseEvaluationFilters } from "@/lib/filters";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await getAdminUser();
  } catch (error) {
    if (error instanceof AuthError) return new NextResponse("Unauthorized", { status: 401 });
    if (error instanceof ConfigError) return new NextResponse("Service unavailable", { status: 503 });
    throw error;
  }

  const url = new URL(request.url);
  const filters = parseEvaluationFilters(Object.fromEntries(url.searchParams.entries()));
  const rows = await getEvaluationsForExport(filters);
  const csv = toCsv(rows.map(evaluationToCsvRow));
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="bora-cupping-evaluations.csv"',
      "Cache-Control": "no-store",
    },
  });
}
