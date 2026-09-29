"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { AppError, friendlyError, throwIfError } from "@/lib/errors";
import { getServiceClient } from "@/lib/supabase/admin";
import { coffeeSchema, eventSchema, sessionSchema, zodFieldErrors, type ActionResult } from "@/lib/validations";

function revalidateCupping() {
  revalidatePath("/");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/events");
  revalidatePath("/admin/sessions");
  revalidatePath("/admin/coffees");
  revalidatePath("/admin/qr-codes");
  revalidatePath("/admin/analytics");
  revalidatePath("/session", "layout");
}

const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function uploadCoffeePhoto(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const coffeeId = String(formData.get("coffeeId") ?? "");
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { ok: true };
  const extension = PHOTO_TYPES[file.type];
  if (!extension) return { ok: false, message: "Use a JPG, PNG, or WebP photo." };
  if (file.size > 4 * 1024 * 1024) return { ok: false, message: "Use a photo under 4 MB." };
  if (!/^[0-9a-f-]{36}$/i.test(coffeeId)) return { ok: false, message: "That coffee could not be found." };

  try {
    const supabase = getServiceClient();
    const bucket = "coffee-photos";
    const { data: existingBucket } = await supabase.storage.getBucket(bucket);
    if (!existingBucket) {
      const { error: bucketError } = await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: "4MB",
        allowedMimeTypes: Object.keys(PHOTO_TYPES),
      });
      if (bucketError && !/already exists/i.test(bucketError.message)) throw new AppError("Something went wrong while saving the photo.");
    }

    const path = `${coffeeId}.${extension}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: true });
    throwIfError(uploadError, "Something went wrong while saving the photo.");
    const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(path);
    const { error } = await supabase.from("coffee_lots").update({ photo_url: `${publicUrl.publicUrl}?v=${Date.now()}` }).eq("id", coffeeId);
    if (error && /photo_url|schema cache/i.test(error.message)) {
      throw new AppError("Run the coffee photo update in the Supabase SQL editor, then save the photo again.");
    }
    throwIfError(error, "Something went wrong while saving the photo.");
    revalidateCupping();
    return { ok: true };
  } catch (error) {
    return { ok: false, message: friendlyError(error, "Something went wrong while saving the photo.") };
  }
}

export async function uploadSessionPhoto(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const sessionId = String(formData.get("sessionId") ?? "");
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { ok: true };
  const extension = PHOTO_TYPES[file.type];
  if (!extension) return { ok: false, message: "Use a JPG, PNG, or WebP photo." };
  if (file.size > 4 * 1024 * 1024) return { ok: false, message: "Use a photo under 4 MB." };
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) return { ok: false, message: "That session could not be found." };

  try {
    const supabase = getServiceClient();
    const bucket = "session-photos";
    const { data: existingBucket } = await supabase.storage.getBucket(bucket);
    if (!existingBucket) {
      const { error: bucketError } = await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: "4MB",
        allowedMimeTypes: Object.keys(PHOTO_TYPES),
      });
      if (bucketError && !/already exists/i.test(bucketError.message)) throw new AppError("Something went wrong while saving the photo.");
    }

    const path = `${sessionId}.${extension}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: true });
    throwIfError(uploadError, "Something went wrong while saving the photo.");
    const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(path);
    const { error } = await supabase.from("sessions").update({ photo_url: `${publicUrl.publicUrl}?v=${Date.now()}` }).eq("id", sessionId);
    if (error && /photo_url|schema cache/i.test(error.message)) {
      throw new AppError("Run the session photo update in the Supabase SQL editor, then save the photo again.");
    }
    throwIfError(error, "Something went wrong while saving the photo.");
    revalidateCupping();
    return { ok: true };
  } catch (error) {
    return { ok: false, message: friendlyError(error, "Something went wrong while saving the photo.") };
  }
}

export async function saveEvent(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Please check the event details.", fieldErrors: zodFieldErrors(parsed.error) };
  try {
    const supabase = getServiceClient();
    if (id) {
      const { error } = await supabase.from("events").update(parsed.data).eq("id", id);
      throwIfError(error, "Something went wrong while saving the event.");
      revalidateCupping();
      return { ok: true, data: { id } };
    }
    const { data, error } = await supabase.from("events").insert(parsed.data).select("id").single();
    throwIfError(error, "Something went wrong while saving the event.");
    if (!data?.id) throw new AppError("Something went wrong while saving the event.");
    revalidateCupping();
    return { ok: true, data: { id: data.id as string } };
  } catch (error) {
    return { ok: false, message: friendlyError(error, "Something went wrong while saving the event.") };
  }
}

export async function setEventActive(id: string, active: boolean): Promise<ActionResult> {
  await requireAdmin();
  try {
    const { error } = await getServiceClient().from("events").update({ active }).eq("id", id);
    throwIfError(error, "Something went wrong while updating the event.");
    revalidateCupping();
    return { ok: true };
  } catch (error) {
    return { ok: false, message: friendlyError(error, "Something went wrong while updating the event.") };
  }
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const supabase = getServiceClient();
    const { count, error: countError } = await supabase.from("sessions").select("*", { count: "exact", head: true }).eq("event_id", id);
    throwIfError(countError, "Something went wrong while deleting the event.");
    if ((count ?? 0) > 0) return { ok: false, message: "This event still has sessions. Deactivate it, or remove the sessions first." };
    const { error } = await supabase.from("events").delete().eq("id", id);
    throwIfError(error, "Something went wrong while deleting the event.");
    revalidateCupping();
    return { ok: true };
  } catch (error) {
    return { ok: false, message: friendlyError(error, "Something went wrong while deleting the event.") };
  }
}

export async function saveSession(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = sessionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Please check the session details.", fieldErrors: zodFieldErrors(parsed.error) };
  try {
    const supabase = getServiceClient();
    const { data: clash, error: clashError } = await supabase.from("sessions").select("id").eq("slug", parsed.data.slug).maybeSingle();
    throwIfError(clashError, "Something went wrong while saving the session.");
    if (clash && clash.id !== id) {
      return { ok: false, message: "That session link is already in use.", fieldErrors: { slug: "Choose a different slug." } };
    }
    if (id) {
      const { error } = await supabase.from("sessions").update(parsed.data).eq("id", id);
      throwIfError(error, "Something went wrong while saving the session.");
      revalidateCupping();
      revalidatePath(`/session/${parsed.data.slug}`);
      return { ok: true, data: { id } };
    }
    const { data, error } = await supabase.from("sessions").insert(parsed.data).select("id").single();
    throwIfError(error, "Something went wrong while saving the session.");
    if (!data?.id) throw new AppError("Something went wrong while saving the session.");
    revalidateCupping();
    return { ok: true, data: { id: data.id as string } };
  } catch (error) {
    return { ok: false, message: friendlyError(error, "Something went wrong while saving the session.") };
  }
}

export async function setSessionActive(id: string, active: boolean): Promise<ActionResult> {
  await requireAdmin();
  try {
    const { error } = await getServiceClient().from("sessions").update({ active }).eq("id", id);
    throwIfError(error, "Something went wrong while updating the session.");
    revalidateCupping();
    return { ok: true };
  } catch (error) {
    return { ok: false, message: friendlyError(error, "Something went wrong while updating the session.") };
  }
}

export async function deleteSession(id: string): Promise<ActionResult<{ deactivated?: boolean }>> {
  await requireAdmin();
  try {
    const supabase = getServiceClient();
    const { count, error: countError } = await supabase.from("participant_sessions").select("*", { count: "exact", head: true }).eq("session_id", id);
    throwIfError(countError, "Something went wrong while deleting the session.");
    if ((count ?? 0) > 0) {
      const { error } = await supabase.from("sessions").update({ active: false }).eq("id", id);
      throwIfError(error, "Something went wrong while deactivating the session.");
      revalidateCupping();
      return { ok: true, data: { deactivated: true } };
    }
    const { error } = await supabase.from("sessions").delete().eq("id", id);
    throwIfError(error, "Something went wrong while deleting the session.");
    revalidateCupping();
    return { ok: true, data: {} };
  } catch (error) {
    return { ok: false, message: friendlyError(error, "Something went wrong while deleting the session.") };
  }
}

export async function saveCoffee(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = coffeeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Please check the coffee details.", fieldErrors: zodFieldErrors(parsed.error) };
  try {
    const supabase = getServiceClient();
    if (id) {
      const { error } = await supabase.from("coffee_lots").update(parsed.data).eq("id", id);
      throwIfError(error, "Something went wrong while saving the coffee.");
      revalidateCupping();
      return { ok: true, data: { id } };
    }
    const { data, error } = await supabase.from("coffee_lots").insert(parsed.data).select("id").single();
    throwIfError(error, "Something went wrong while saving the coffee.");
    if (!data?.id) throw new AppError("Something went wrong while saving the coffee.");
    revalidateCupping();
    return { ok: true, data: { id: data.id as string } };
  } catch (error) {
    return { ok: false, message: friendlyError(error, "Something went wrong while saving the coffee.") };
  }
}

export async function moveCoffee(id: string, direction: "up" | "down"): Promise<ActionResult> {
  await requireAdmin();
  try {
    const supabase = getServiceClient();
    const { data: coffee, error } = await supabase.from("coffee_lots").select("id, session_id").eq("id", id).maybeSingle();
    throwIfError(error, "Something went wrong while reordering coffees.");
    if (!coffee) return { ok: false, message: "That coffee could not be found." };
    const { data: siblings, error: listError } = await supabase
      .from("coffee_lots")
      .select("id")
      .eq("session_id", coffee.session_id)
      .order("display_order", { ascending: true })
      .order("lot_name", { ascending: true });
    throwIfError(listError, "Something went wrong while reordering coffees.");
    const ordered = (siblings ?? []).map((item, index) => ({ id: item.id as string, display_order: index + 1 }));
    const current = ordered.findIndex((item) => item.id === id);
    const target = direction === "up" ? current - 1 : current + 1;
    if (current < 0 || target < 0 || target >= ordered.length) return { ok: true };
    const currentOrder = ordered[current].display_order;
    ordered[current].display_order = ordered[target].display_order;
    ordered[target].display_order = currentOrder;
    const updates = ordered.map((item) => supabase.from("coffee_lots").update({ display_order: item.display_order }).eq("id", item.id));
    const results = await Promise.all(updates);
    for (const result of results) throwIfError(result.error, "Something went wrong while reordering coffees.");
    revalidateCupping();
    return { ok: true };
  } catch (error) {
    return { ok: false, message: friendlyError(error, "Something went wrong while reordering coffees.") };
  }
}

export async function deleteCoffee(id: string): Promise<ActionResult<{ deactivated?: boolean }>> {
  await requireAdmin();
  try {
    const supabase = getServiceClient();
    const { count, error: countError } = await supabase.from("evaluations").select("*", { count: "exact", head: true }).eq("coffee_lot_id", id);
    throwIfError(countError, "Something went wrong while deleting the coffee.");
    if ((count ?? 0) > 0) {
      const { error } = await supabase.from("coffee_lots").update({ active: false }).eq("id", id);
      throwIfError(error, "Something went wrong while deactivating the coffee.");
      revalidateCupping();
      return { ok: true, data: { deactivated: true } };
    }
    const { error } = await supabase.from("coffee_lots").delete().eq("id", id);
    throwIfError(error, "Something went wrong while deleting the coffee.");
    revalidateCupping();
    return { ok: true, data: {} };
  } catch (error) {
    return { ok: false, message: friendlyError(error, "Something went wrong while deleting the coffee.") };
  }
}
