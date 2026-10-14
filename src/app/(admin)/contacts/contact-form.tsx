"use client";

import { useActionState } from "react";
import {
  CONTACT_SOURCES,
  PIPELINE_LABELS,
  PIPELINE_STAGES,
  SOURCE_LABELS,
  type Contact,
} from "@/lib/types";
import type { ActionState } from "@/lib/validation";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";

export function ContactForm({
  action,
  contact,
  submitLabel,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  contact?: Contact;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const e = state.fieldErrors ?? {};

  const text = (
    name: keyof Contact,
    label: string,
    opts: { type?: string; placeholder?: string; span?: string; required?: boolean } = {},
  ) => (
    <Field label={label} htmlFor={name} error={e[name]} className={opts.span}>
      <Input
        id={name}
        name={name}
        type={opts.type ?? "text"}
        required={opts.required}
        placeholder={opts.placeholder}
        defaultValue={(contact?.[name] as string | null) ?? ""}
      />
    </Field>
  );

  return (
    <form action={formAction} className="space-y-6">
      <fieldset className="grid gap-3 sm:grid-cols-4">
        <legend className="mb-2 text-sm font-semibold">Business</legend>
        {text("business_name", "Business name", {
          required: true,
          span: "sm:col-span-2",
          placeholder: "Green Acres Lawn Care",
        })}
        {text("category", "Category", { placeholder: "Lawn Care" })}
        <Field label="Stage" htmlFor="pipeline_stage" error={e.pipeline_stage}>
          <Select id="pipeline_stage" name="pipeline_stage" defaultValue={contact?.pipeline_stage ?? "lead"}>
            {PIPELINE_STAGES.map((s) => (
              <option key={s} value={s}>
                {PIPELINE_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
        {text("website", "Website", { span: "sm:col-span-2", placeholder: "greenacres.com" })}
        {text("facebook_url", "Facebook page", { span: "sm:col-span-2", placeholder: "facebook.com/greenacres" })}
        {text("address", "Address", { span: "sm:col-span-4" })}
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-4">
        <legend className="mb-2 text-sm font-semibold">Contact</legend>
        {text("contact_name", "Owner / contact", { span: "sm:col-span-2" })}
        {text("phone", "Phone", { type: "tel" })}
        {text("email", "Email", { type: "email" })}
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-4">
        <legend className="mb-2 text-sm font-semibold">Tracking</legend>
        <Field label="Source" htmlFor="source" error={e.source}>
          <Select id="source" name="source" defaultValue={contact?.source ?? ""}>
            <option value="">—</option>
            {CONTACT_SOURCES.map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Tags"
          htmlFor="tags"
          error={e.tags}
          hint="Comma-separated, e.g. westridge, no-website"
          className="sm:col-span-3"
        >
          <Input id="tags" name="tags" defaultValue={contact?.tags.join(", ") ?? ""} />
        </Field>
        <Field label="Notes" htmlFor="notes" error={e.notes} className="sm:col-span-4">
          <Textarea id="notes" name="notes" defaultValue={contact?.notes ?? ""} />
        </Field>
      </fieldset>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        {state.message ? (
          <p className={state.ok ? "text-sm text-green-700" : "text-sm text-red-600"} role="status">
            {state.message}
          </p>
        ) : Object.keys(e).length ? (
          <p className="text-sm text-red-600">Check the highlighted fields.</p>
        ) : null}
      </div>
    </form>
  );
}
