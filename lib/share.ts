import { createHmac, timingSafeEqual } from "node:crypto";

export const SHARE_TOKEN_LENGTH = 24;

function shareSecret() {
  return process.env.REVIEW_SHARE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "bora-cup-local-share";
}

/** Unguessable token for a session review or table-setup link. */
export function sessionShareToken(sessionId: string) {
  return createHmac("sha256", shareSecret()).update(`share:${sessionId}`).digest("base64url").slice(0, SHARE_TOKEN_LENGTH);
}

export function isValidShareToken(sessionId: string, token: string) {
  if (!token || token.length !== SHARE_TOKEN_LENGTH) return false;
  const expected = sessionShareToken(sessionId);
  return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

export function sharePaths(slug: string, sessionId: string) {
  const token = sessionShareToken(sessionId);
  return {
    token,
    review: `/review/${slug}/${token}`,
    table: `/table/${slug}/${token}`,
  };
}
