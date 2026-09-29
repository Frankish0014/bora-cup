"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { AppError, friendlyError, throwIfError } from "@/lib/errors";
import { getServiceClient } from "@/lib/supabase/admin";
import { organizerSchema, organizerUpdateSchema, zodFieldErrors, type ActionResult } from "@/lib/validations";

function revalidateOrganizers() {
  revalidatePath("/admin/settings");
}

export async function createOrganizer(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = organizerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Please check the organizer details.", fieldErrors: zodFieldErrors(parsed.error) };

  const supabase = getServiceClient();
  const name = parsed.data.name.trim();
  const { data, error } = await supabase.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: name ? { full_name: name } : undefined,
  });
  if (error || !data.user) {
    if (error && /already been registered|already exists|already registered/i.test(error.message)) {
      return { ok: false, message: "That email already has an account. Use a different email.", fieldErrors: { email: "That email is already in use." } };
    }
    return { ok: false, message: "Something went wrong while creating the organizer." };
  }

  const { error: profileError } = await supabase.from("admin_profiles").insert({ user_id: data.user.id });
  if (profileError) {
    await supabase.auth.admin.deleteUser(data.user.id);
    return { ok: false, message: "Something went wrong while creating the organizer." };
  }

  revalidateOrganizers();
  return { ok: true };
}

async function requireSuperAdmin() {
  const current = await requireAdmin();
  const supabase = getServiceClient();
  const { data, error } = await supabase.auth.admin.getUserById(current.id);
  throwIfError(error, "Something went wrong while checking access.");
  const role = (data.user?.user_metadata as { role?: string } | undefined)?.role;
  if (role !== "super") throw new AppError("Only the super admin can change organizers.");
  return { current, supabase };
}

export async function updateOrganizer(input: unknown): Promise<ActionResult> {
  try {
    const { supabase } = await requireSuperAdmin();
    const parsed = organizerUpdateSchema.safeParse(input);
    if (!parsed.success) return { ok: false, message: "Please check the organizer details.", fieldErrors: zodFieldErrors(parsed.error) };

    const { data: existing, error: lookupError } = await supabase.auth.admin.getUserById(parsed.data.userId);
    throwIfError(lookupError, "That organizer could not be found.");
    if (!existing.user) throw new AppError("That organizer could not be found.");

    const { data: profile, error: profileError } = await supabase.from("admin_profiles").select("user_id").eq("user_id", parsed.data.userId).maybeSingle();
    throwIfError(profileError, "That organizer could not be found.");
    if (!profile) throw new AppError("That organizer could not be found.");

    const metadata = (existing.user.user_metadata ?? {}) as { full_name?: string; role?: string };
    const name = parsed.data.name.trim();
    const password = parsed.data.password.trim();
    const { error } = await supabase.auth.admin.updateUserById(parsed.data.userId, {
      email: parsed.data.email,
      email_confirm: true,
      password: password ? password : undefined,
      user_metadata: { ...metadata, full_name: name },
    });
    if (error && /already been registered|already exists|already registered/i.test(error.message)) {
      return { ok: false, message: "That email already has an account.", fieldErrors: { email: "That email is already in use." } };
    }
    throwIfError(error, "Something went wrong while saving the organizer.");
    revalidateOrganizers();
    return { ok: true };
  } catch (error) {
    return { ok: false, message: friendlyError(error, "Something went wrong while saving the organizer.") };
  }
}

export async function removeOrganizer(userId: string): Promise<ActionResult> {
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return { ok: false, message: "That organizer could not be found." };

  try {
    const { current, supabase } = await requireSuperAdmin();
    if (current.id === userId) return { ok: false, message: "You cannot remove your own access." };

    const { data: target, error: targetError } = await supabase.auth.admin.getUserById(userId);
    throwIfError(targetError, "That organizer could not be found.");
    const role = (target.user?.user_metadata as { role?: string } | undefined)?.role;
    if (role === "super") throw new AppError("The super admin cannot be removed.");

    const { count, error: countError } = await supabase.from("admin_profiles").select("*", { count: "exact", head: true });
    throwIfError(countError, "Something went wrong while removing access.");
    if ((count ?? 0) <= 1) throw new AppError("Keep at least one organizer who can sign in.");

    const { error } = await supabase.auth.admin.deleteUser(userId);
    throwIfError(error, "Something went wrong while removing access.");
    revalidateOrganizers();
    return { ok: true };
  } catch (error) {
    return { ok: false, message: friendlyError(error, "Something went wrong while removing access.") };
  }
}
