"use client";

import { useActionState } from "react";
import type { CardFormat } from "@/lib/types";
import type { ActionState } from "@/lib/validation";
import { useCloseDrawerOnSave } from "@/components/drawer";
import { Button, Field, Input, Textarea } from "@/components/ui";

export function FormatForm({
  action,
  format,
  submitLabel,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  format?: CardFormat;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  useCloseDrawerOnSave(state.ok);
  const e = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-4">
      <Field label="Name" htmlFor="name" error={e.name} className="sm:col-span-4">
        <Input id="name" name="name" required defaultValue={format?.name} placeholder="9x12 Shared" />
      </Field>
      <Field label="Width (in)" htmlFor="width_in" error={e.width_in}>
        <Input id="width_in" name="width_in" inputMode="decimal" required defaultValue={format?.width_in} />
      </Field>
      <Field label="Height (in)" htmlFor="height_in" error={e.height_in}>
        <Input id="height_in" name="height_in" inputMode="decimal" required defaultValue={format?.height_in} />
      </Field>
      <Field label="Default homes" htmlFor="homes_default" error={e.homes_default} className="sm:col-span-2">
        <Input
          id="homes_default"
          name="homes_default"
          inputMode="numeric"
          defaultValue={format?.homes_default ?? ""}
        />
      </Field>
      <Field label="Notes" htmlFor="notes" error={e.notes} className="sm:col-span-4">
        <Textarea id="notes" name="notes" defaultValue={format?.notes ?? ""} />
      </Field>
      <div className="flex items-center gap-3 sm:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        {state.message ? (
          <p className={state.ok ? "text-sm text-green-700" : "text-sm text-red-600"}>
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
