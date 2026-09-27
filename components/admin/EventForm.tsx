"use client";

import { FormActions, FormSection } from "@/components/admin/FormSection";
import { saveEvent } from "@/lib/actions/admin";
import { eventSchema } from "@/lib/validations";
import { Alert, Checkbox, Field, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";

type Values = z.input<typeof eventSchema>;

export function EventForm({
  id,
  defaults,
}: {
  id?: string;
  defaults?: { name: string; description: string | null; start_date: string | null; end_date: string | null; active: boolean };
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: defaults?.name ?? "",
      description: defaults?.description ?? "",
      start_date: defaults?.start_date ?? "",
      end_date: defaults?.end_date ?? "",
      active: defaults?.active ?? true,
    },
  });
  const errors = form.formState.errors;

  return (
    <form
      className="space-y-5"
      onSubmit={form.handleSubmit(async (values) => {
        setMessage(null);
        const result = await saveEvent(id ?? null, values);
        if (!result.ok) {
          setMessage(result.message);
          return;
        }
        router.push(`/admin/events/${result.data?.id ?? id}`);
        router.refresh();
      })}
    >
      {message ? <Alert>{message}</Alert> : null}
      <FormSection title="Event" description="The name appears on the home page and in the admin.">
        <Field label="Name" error={errors.name?.message}>
          <Input placeholder="Best of Rwanda Cup Tour 2026" {...form.register("name")} />
        </Field>
        <Field label="Description" hint="Optional" error={errors.description?.message}>
          <Textarea {...form.register("description")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start date" error={errors.start_date?.message}>
            <Input type="date" {...form.register("start_date")} />
          </Field>
          <Field label="End date" error={errors.end_date?.message}>
            <Input type="date" {...form.register("end_date")} />
          </Field>
        </div>
      </FormSection>
      <FormSection title="Visibility" description="Inactive events hide all their sessions from participants.">
        <Controller
          name="active"
          control={form.control}
          render={({ field }) => (
            <Checkbox label="Active" description="Participants can open this event's sessions." checked={Boolean(field.value)} onChange={(event) => field.onChange(event.target.checked)} />
          )}
        />
      </FormSection>
      <FormActions>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving…" : "Save event"}
        </Button>
      </FormActions>
    </form>
  );
}
