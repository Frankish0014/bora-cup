import "server-only";
import { redirect } from "next/navigation";
import { AuthError, ConfigError } from "@/lib/errors";
import { createAuthClient } from "@/lib/supabase/server";

export async function getAdminUser() {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { data, error } = await supabase.from("admin_profiles").select("user_id").eq("user_id", user.id).maybeSingle();
  if (error || !data) throw new AuthError("This account does not have administrator access.");
  return user;
}

export async function requireAdmin() {
  try {
    return await getAdminUser();
  } catch (error) {
    if (error instanceof ConfigError) redirect("/admin/login?error=config");
    if (error instanceof AuthError) redirect("/admin/login?error=unauthorized");
    throw error;
  }
}
