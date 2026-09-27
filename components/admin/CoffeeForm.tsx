"use client";

import { FormActions, FormSection } from "@/components/admin/FormSection";
import { saveCoffee } from "@/lib/actions/admin";
import { coffeeSchema } from "@/lib/validations";
import { Alert, Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";

type Values = z.input<typeof coffeeSchema>;

const ORIGIN_FIELDS = [
  ["country", "Country", "Rwanda"],
  ["district", "District", "Nyamasheke"],
  ["washing_station", "Washing station", ""],
  ["producer", "Producer", ""],
  ["cooperative", "Cooperative", ""],
] as const;

const COFFEE_FIELDS = [
  ["variety", "Variety", "Red Bourbon"],
  ["process", "Process", "Fully Washed"],
  ["altitude", "Altitude", "1,900 MASL"],
  ["harvest", "Harvest", "2026"],
] as const;

export function CoffeeForm({
  id,
  sessions,
  defaults,
}: {
  id?: string;
  sessions: Array<{ id: string; name: string }>;
  defaults?: Partial<Values> & { session_id?: string; lot_name?: string; display_order?: number; active?: boolean };
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(coffeeSchema),
    defaultValues: {
      session_id: defaults?.session_id ?? sessions[0]?.id ?? "",
      lot_name: defaults?.lot_name ?? "",
      lot_number: defaults?.lot_number ?? "",
      cupping_code: defaults?.cupping_code ?? "",
      washing_station: defaults?.washing_station ?? "",
      district: defaults?.district ?? "",
      country: defaults?.country ?? "Rwanda",
      variety: defaults?.variety ?? "",
      process: defaults?.process ?? "",
      altitude: defaults?.altitude ?? "",
      harvest: defaults?.harvest ?? "",
      producer: defaults?.producer ?? "",
      cooperative: defaults?.cooperative ?? "",
      description: defaults?.description ?? "",
      display_order: defaults?.display_order ?? 1,
      active: defaults?.active ?? true,
    },
  });
  const errors = form.formState.errors;

  return (
    <form
      className="space-y-5"
      onSubmit={form.handleSubmit(async (values) => {
        setMessage(null);
        const result = await saveCoffee(id ?? null, values);
        if (!result.ok) {
          setMessage(result.message);
          return;
        }
        router.push("/admin/coffees");
        router.refresh();
      })}
    >
      {message ? <Alert>{message}</Alert> : null}
      <FormSection title="Basic information" description="The lot name is the headline participants see. The code is shown as a small tag.">
        <Field label="Session" error={errors.session_id?.message}>
          <Select {...form.register("session_id")}>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Lot name" error={errors.lot_name?.message}>
          <Input placeholder="Fully Washed #1" {...form.register("lot_name")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Lot number" hint="Optional">
            <Input placeholder="FW-001" {...form.register("lot_number")} />
          </Field>
          <Field label="Cupping code" hint="Optional">
            <Input placeholder="BORA-FW-001" className="font-mono" {...form.register("cupping_code")} />
          </Field>
        </div>
      </FormSection>
      <FormSection title="Origin" description="Leave anything unknown blank. Empty fields are hidden on the cupping sheet.">
        <div className="grid gap-4 sm:grid-cols-2">
          {ORIGIN_FIELDS.map(([name, label, placeholder]) => (
            <Field key={name} label={label} hint="Optional">
              <Input placeholder={placeholder} {...form.register(name)} />
            </Field>
          ))}
        </div>
      </FormSection>
      <FormSection title="Coffee" description="Processing and growing details.">
        <div className="grid gap-4 sm:grid-cols-2">
          {COFFEE_FIELDS.map(([name, label, placeholder]) => (
            <Field key={name} label={label} hint="Optional">
              <Input placeholder={placeholder} {...form.register(name)} />
            </Field>
          ))}
        </div>
      </FormSection>
      <FormSection title="Additional" description="Notes appear in italics under the coffee facts.">
        <Field label="Notes" hint="Optional">
          <Textarea {...form.register("description")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <Field label="Display order" error={errors.display_order?.message}>
            <Controller
              name="display_order"
              control={form.control}
              render={({ field }) => (
                <Input type="number" min={0} inputMode="numeric" value={field.value ?? 0} onChange={(event) => field.onChange(Number(event.target.value))} />
              )}
            />
          </Field>
          <Controller
            name="active"
            control={form.control}
            render={({ field }) => (
              <div className="sm:pt-7">
                <Checkbox label="Active" description="Shown in the session sequence." checked={Boolean(field.value)} onChange={(event) => field.onChange(event.target.checked)} />
              </div>
            )}
          />
        </div>
      </FormSection>
      <FormActions>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving…" : "Save coffee"}
        </Button>
      </FormActions>
    </form>
  );
}
