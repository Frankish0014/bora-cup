"use client";

import { Alert, Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { CountrySelect } from "@/components/participant/CountrySelect";
import { startCupping } from "@/lib/actions/participant";
import { participantSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";

type FormValues = z.input<typeof participantSchema>;

export function ParticipantForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(participantSchema),
    defaultValues: { name: "", email: "", country: "Rwanda", organization: "", role: "" },
  });
  const errors = form.formState.errors;

  async function onSubmit(values: FormValues) {
    setFormError(null);
    const result = await startCupping(slug, values);
    if (!result.ok) {
      if (result.fieldErrors) {
        for (const [key, message] of Object.entries(result.fieldErrors)) {
          form.setError(key as keyof FormValues, { message });
        }
      }
      setFormError(result.message);
      return;
    }
    router.push(`/session/${slug}/cup`);
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      {formError ? <Alert>{formError}</Alert> : null}
      <Field label="Full name" error={errors.name?.message}>
        <Input autoComplete="name" aria-invalid={Boolean(errors.name)} {...form.register("name")} />
      </Field>
      <Field label="Email" error={errors.email?.message}>
        <Input type="email" autoComplete="email" inputMode="email" aria-invalid={Boolean(errors.email)} {...form.register("email")} />
      </Field>
      <Controller
        name="country"
        control={form.control}
        render={({ field, fieldState }) => <CountrySelect value={field.value ?? ""} onChange={field.onChange} error={fieldState.error?.message} />}
      />
      <Field label="Organization" hint="Optional" error={errors.organization?.message}>
        <Input autoComplete="organization" {...form.register("organization")} />
      </Field>
      <Field label="Role" hint="Optional" error={errors.role?.message}>
        <Input autoComplete="organization-title" {...form.register("role")} />
      </Field>
      <Button type="submit" className="mt-2 w-full min-h-14 text-base" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Starting…" : "Continue to the first coffee"}
      </Button>
    </form>
  );
}
