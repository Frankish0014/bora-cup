import { getAdminUser } from "@/lib/auth";
import { getSessionBySlug } from "@/lib/data/cupping";
import { AuthError, ConfigError } from "@/lib/errors";
import { getAppUrl } from "@/lib/url";
import { isSlug } from "@/lib/utils";
import QRCode from "qrcode";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    await getAdminUser();
  } catch (error) {
    if (error instanceof AuthError) return new NextResponse("Unauthorized", { status: 401 });
    if (error instanceof ConfigError) return new NextResponse("Service unavailable", { status: 503 });
    throw error;
  }

  const { slug } = await context.params;
  if (!isSlug(slug)) return new NextResponse("Not found", { status: 404 });
  const session = await getSessionBySlug(slug);
  if (!session) return new NextResponse("Not found", { status: 404 });

  const appUrl = await getAppUrl();
  const png = await QRCode.toBuffer(`${appUrl}/session/${session.slug}`, {
    type: "png",
    width: 1024,
    margin: 2,
    errorCorrectionLevel: "H",
  });
  const download = new URL(request.url).searchParams.get("download") === "1";
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${session.slug}-qr.png"`,
    },
  });
}
