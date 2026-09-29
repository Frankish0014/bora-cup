import "server-only";
import { throwIfError } from "@/lib/errors";
import { getServiceClient } from "@/lib/supabase/admin";
import type { Organizer } from "@/types/domain";

export type { Organizer };

type ListedUser = {
  id: string;
  email: string;
  createdAt: string;
  metadata: { full_name?: string; role?: string };
};

export async function getOrganizers() {
  const supabase = getServiceClient();
  const { data: profiles, error } = await supabase.from("admin_profiles").select("user_id, created_at").order("created_at");
  throwIfError(error, "Something went wrong while loading organizers.");
  const createdAt = new Map((profiles ?? []).map((profile) => [profile.user_id as string, profile.created_at as string]));
  if (createdAt.size === 0) return [];

  const listed: ListedUser[] = [];
  for (let page = 1; page <= 5; page += 1) {
    const { data, error: listError } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    throwIfError(listError, "Something went wrong while loading organizers.");
    for (const user of data.users) {
      const joined = createdAt.get(user.id);
      if (!joined) continue;
      listed.push({
        id: user.id,
        email: user.email ?? "",
        createdAt: joined,
        metadata: (user.user_metadata ?? {}) as ListedUser["metadata"],
      });
    }
    if (data.users.length < 200) break;
  }

  let superId = listed.find((user) => user.metadata.role === "super")?.id ?? null;
  if (!superId && listed.length > 0) {
    const oldest = [...listed].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
    superId = oldest.id;
    const { error: promoteError } = await supabase.auth.admin.updateUserById(oldest.id, {
      user_metadata: { ...oldest.metadata, role: "super" },
    });
    throwIfError(promoteError, "Something went wrong while loading organizers.");
  }

  return listed
    .map((user) => ({
      id: user.id,
      email: user.email,
      name: user.metadata.full_name?.trim() || null,
      createdAt: user.createdAt,
      isSuper: user.id === superId,
    }))
    .sort((a, b) => a.email.localeCompare(b.email));
}
