"use client";

import { FormActions, FormSection } from "@/components/admin/FormSection";
import { saveSession, uploadSessionPhoto } from "@/lib/actions/admin";
import { sessionSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { Alert, Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { z } from "zod";

type Values = z.input<typeof sessionSchema>;

export function SessionForm({
  id,
  events,
  defaults,
}: {
  id?: string;
  events: Array<{ id: string; name: string }>;
  defaults?: { event_id: string; name: string; category: string; slug: string; description: string | null; active: boolean; photo_url?: string | null };
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(defaults?.photo_url ?? null);
  const [savedId, setSavedId] = useState(id);
  const [slugTouched, setSlugTouched] = useState(Boolean(defaults?.slug));
  const form = useForm<Values>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      event_id: defaults?.event_id ?? events[0]?.id ?? "",
      name: defaults?.name ?? "",
      category: defaults?.category ?? "",
      slug: defaults?.slug ?? "",
      description: defaults?.description ?? "",
      active: defaults?.active ?? true,
    },
  });
  const errors = form.formState.errors;
  const slug = useWatch({ control: form.control, name: "slug" });

  useEffect(() => {
    if (!photo) return;
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  return (
    <form
      className="space-y-5"
      onSubmit={form.handleSubmit(async (values) => {
        setMessage(null);
        const result = await saveSession(savedId ?? null, values);
        if (!result.ok || !result.data?.id) {
          if (!result.ok && result.fieldErrors) {
            for (const [key, fieldMessage] of Object.entries(result.fieldErrors)) {
              form.setError(key as keyof Values, { message: fieldMessage });
            }
          }
          setMessage(result.ok ? "Something went wrong while saving the session." : result.message);
          return;
        }
        setSavedId(result.data.id);
        if (photo) {
          const body = new FormData();
          body.set("sessionId", result.data.id);
          body.set("photo", photo);
          const uploaded = await uploadSessionPhoto(body);
          if (!uploaded.ok) {
            setMessage(uploaded.message);
            return;
          }
        }
        router.push(`/admin/sessions/${result.data.id}`);
        router.refresh();
      })}
    >
      {message ? <Alert>{message}</Alert> : null}
      <FormSection title="Session" description="A session is one cupping table with its own ordered list of coffees. A photo sits on the open-sessions card.">
        <Field label="Event" error={errors.event_id?.message}>
          <Select {...form.register("event_id")}>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Session name" error={errors.name?.message}>
            <Input
              placeholder="Fully Washed"
              {...form.register("name")}
              onChange={(event) => {
                form.setValue("name", event.target.value);
                if (!slugTouched) form.setValue("slug", slugify(event.target.value));
              }}
            />
          </Field>
          <Field label="Category" hint="e.g. Washed, Natural" error={errors.category?.message}>
            <Input placeholder="Washed" {...form.register("category")} />
          </Field>
        </div>
        <Field label="Description" hint="Optional" error={errors.description?.message}>
          <Textarea {...form.register("description")} />
        </Field>
        <Field label="Photo" hint="Optional. JPG, PNG, or WebP under 4 MB. Shown on the open sessions list.">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-leaf file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
          />
          {preview ? <img src={preview} alt="" className="mt-3 h-28 w-44 rounded-xl object-cover" /> : null}
        </Field>
      </FormSection>
      <FormSection title="Link & QR" description="The slug becomes the QR link. Keep it short and lowercase.">
        <Field label="Slug" error={errors.slug?.message}>
          <Input
            {...form.register("slug")}
            onChange={(event) => {
              setSlugTouched(true);
              form.setValue("slug", event.target.value);
            }}
          />
        </Field>
        <p className="text-xs text-ink-soft">
          Participants will open <code className="rounded-md bg-paper-2 px-1.5 py-0.5 font-mono text-[11px] text-ink">/session/{slug || "…"}</code>
        </p>
      </FormSection>
      <FormSection title="Visibility" description="Inactive sessions show a “closed” message when scanned.">
        <Controller
          name="active"
          control={form.control}
          render={({ field }) => (
            <Checkbox label="Active" description="Participants can start this session." checked={Boolean(field.value)} onChange={(event) => field.onChange(event.target.checked)} />
          )}
        />
      </FormSection>
      <FormActions>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving…" : "Save session"}
        </Button>
      </FormActions>
    </form>
  );
}
