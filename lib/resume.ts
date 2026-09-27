const TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const RESUME_COOKIE = "bora_resume";

export function parseResumeTokens(value: string | undefined) {
  if (!value) return [];
  return value
    .split(".")
    .map((token) => token.trim())
    .filter((token) => TOKEN.test(token))
    .slice(0, 8);
}

export function addResumeToken(existing: string | undefined, token: string) {
  const tokens = [token, ...parseResumeTokens(existing).filter((item) => item !== token)].slice(0, 8);
  return tokens.join(".");
}

export const resumeCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 14,
};
