"use client";

import { createOrganizer, removeOrganizer, updateOrganizer } from "@/lib/actions/organizers";
import type { Organizer } from "@/types/domain";
import { organizerSchema, organizerUpdateSchema } from "@/lib/validations";
import { Alert, Field, Input } from "@/components/ui/field";
import { Button, buttonSm } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

type Values = z.input<typeof organizerSchema>;
type EditValues = z.input<typeof organizerUpdateSchema>;

export function OrganizersPanel({ organizers, currentUserId }: { organizers: Organizer[]; currentUserId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Organizer | null>(null);
  const canEdit = organizers.some((organizer) => organizer.id === currentUserId && organizer.isSuper);
  const form = useForm<Values>({
    resolver: zodResolver(organizerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });
  const errors = form.formState.errors;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="card divide-y divide-line">
        {organizers.map((organizer) => {
          const isYou = organizer.id === currentUserId;
          const label = [isYou ? "You" : null, organizer.isSuper ? "Super admin" : null].filter(Boolean).join(" · ");
          return (
            <div key={organizer.id} data-organizer={organizer.id} className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium text-ink">{organizer.name || organizer.email}</p>
                {organizer.name ? <p className="truncate text-sm text-ink-soft">{organizer.email}</p> : null}
                {label ? <p className="text-xs text-ink-mute">{label}</p> : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {canEdit ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className={buttonSm}
                    onClick={() => {
                      setMessage(null);
                      setNotice(null);
                      setEditing(organizer);
                    }}
                  >
                    Edit
                  </Button>
                ) : null}
                {canEdit && !isYou && !organizer.isSuper ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className={buttonSm}
                    disabled={removingId === organizer.id}
                    onClick={async () => {
                      if (!window.confirm(`Remove access for ${organizer.email}? They will no longer be able to sign in.`)) return;
                      setRemovingId(organizer.id);
                      setMessage(null);
                      const result = await removeOrganizer(organizer.id);
                      setRemovingId(null);
                      if (!result.ok) {
                        setMessage(result.message);
                        return;
                      }
                      if (editing?.id === organizer.id) setEditing(null);
                      router.refresh();
                    }}
                  >
                    {removingId === organizer.id ? "Removing…" : "Remove"}
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
        {organizers.length === 0 ? <p className="px-5 py-8 text-center text-sm text-ink-soft">No organizers yet.</p> : null}
      </div>

      {editing ? (
        <EditOrganizerForm
          key={editing.id}
          organizer={editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setNotice("Organizer updated. If you changed the password, they sign in with the new one.");
            router.refresh();
          }}
        />
      ) : (
        <form
          className="card space-y-4 p-5"
          onSubmit={form.handleSubmit(async (values) => {
            setMessage(null);
            setNotice(null);
            const result = await createOrganizer(values);
            if (!result.ok) {
              if (result.fieldErrors) {
                for (const [key, fieldMessage] of Object.entries(result.fieldErrors)) {
                  form.setError(key as keyof Values, { message: fieldMessage });
                }
              }
              setMessage(result.message);
              return;
            }
            form.reset();
            setNotice("They can sign in now and manage sessions, coffees, and the rest of this area.");
            router.refresh();
          })}
        >
          <div>
            <h2 className="text-[15px] font-semibold text-ink">Add an organizer</h2>
            <p className="mt-1 text-sm leading-6 text-ink-soft">They use Organizer sign in. Their access matches yours.</p>
          </div>
          {message ? <Alert>{message}</Alert> : null}
          {notice ? <Alert tone="info">{notice}</Alert> : null}
          <Field label="Name" hint="Optional" error={errors.name?.message}>
            <Input autoComplete="name" {...form.register("name")} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" autoComplete="off" {...form.register("email")} />
          </Field>
          <Field label="Password" hint="At least 8 characters. Share it with them." error={errors.password?.message}>
            <Input type="password" autoComplete="new-password" {...form.register("password")} />
          </Field>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creating…" : "Create organizer"}
          </Button>
        </form>
      )}
    </div>
  );
}

function EditOrganizerForm({ organizer, onCancel, onSaved }: { organizer: Organizer; onCancel: () => void; onSaved: () => void }) {
  const [message, setMessage] = useState<string | null>(null);
  const form = useForm<EditValues>({
    resolver: zodResolver(organizerUpdateSchema),
    defaultValues: { userId: organizer.id, name: organizer.name ?? "", email: organizer.email, password: "" },
  });
  const errors = form.formState.errors;

  return (
    <form
      className="card space-y-4 p-5"
      onSubmit={form.handleSubmit(async (values) => {
        setMessage(null);
        const result = await updateOrganizer(values);
        if (!result.ok) {
          if (result.fieldErrors) {
            for (const [key, fieldMessage] of Object.entries(result.fieldErrors)) {
              form.setError(key as keyof EditValues, { message: fieldMessage });
            }
          }
          setMessage(result.message);
          return;
        }
        onSaved();
      })}
    >
      <div>
        <h2 className="text-[15px] font-semibold text-ink">Edit organizer</h2>
        <p className="mt-1 text-sm leading-6 text-ink-soft">Set a new password, or leave it blank to keep the current one.</p>
      </div>
      {message ? <Alert>{message}</Alert> : null}
      <input type="hidden" {...form.register("userId")} />
      <Field label="Name" hint="Optional" error={errors.name?.message}>
        <Input autoComplete="name" {...form.register("name")} />
      </Field>
      <Field label="Email" error={errors.email?.message}>
        <Input type="email" autoComplete="off" {...form.register("email")} />
      </Field>
      <Field label="New password" hint="Leave blank to keep the current password." error={errors.password?.message}>
        <Input type="password" autoComplete="new-password" {...form.register("password")} />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving…" : "Save changes"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
