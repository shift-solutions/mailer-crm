"use client";

import { useActionState, useState } from "react";
import { centsToDollarInput } from "@/lib/money";
import { CAMPAIGN_STATUSES, type Campaign } from "@/lib/types";
import type { ActionState } from "@/lib/validation";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";

type FormatOption = { id: string; name: string; homes_default: number | null; spots: number };

export function CampaignForm({
  action,
  campaign,
  formats,
  submitLabel,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  campaign?: Campaign;
  /** Only passed when creating; the format can't change afterwards. */
  formats?: FormatOption[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [formatId, setFormatId] = useState(formats?.[0]?.id ?? "");
  const selected = formats?.find((f) => f.id === formatId);
  const e = state.fieldErrors ?? {};

  const money = (name: keyof Campaign, label: string) => (
    <Field label={label} htmlFor={name} error={e[name]}>
      <Input
        id={name}
        name={name}
        inputMode="decimal"
        placeholder="$0"
        defaultValue={centsToDollarInput(campaign?.[name] as number | undefined)}
      />
    </Field>
  );
  const date = (name: keyof Campaign, label: string) => (
    <Field label={label} htmlFor={name} error={e[name]}>
      <Input id={name} name={name} type="date" defaultValue={(campaign?.[name] as string) ?? ""} />
    </Field>
  );

  return (
    <form action={formAction} className="space-y-6">
      <fieldset className="grid gap-3 sm:grid-cols-4">
        <legend className="mb-2 text-sm font-semibold">Basics</legend>
        <Field label="Campaign name" htmlFor="name" error={e.name} className="sm:col-span-2">
          <Input
            id="name"
            name="name"
            required
            defaultValue={campaign?.name}
            placeholder="Westridge Community Card, Nov 2026"
          />
        </Field>
        {formats ? (
          <Field
            label="Card format"
            htmlFor="format_id"
            error={e.format_id}
            hint={selected ? `${selected.spots} spots will be created` : undefined}
          >
            <Select
              id="format_id"
              name="format_id"
              value={formatId}
              onChange={(ev) => setFormatId(ev.target.value)}
              required
            >
              {formats.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
        <Field label="Status" htmlFor="status" error={e.status}>
          <Select id="status" name="status" defaultValue={campaign?.status ?? "planning"}>
            {CAMPAIGN_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Area" htmlFor="area" error={e.area} className="sm:col-span-2">
          <Input id="area" name="area" defaultValue={campaign?.area ?? ""} placeholder="Westridge, McKinney 75072" />
        </Field>
        <Field label="Carrier routes" htmlFor="routes" error={e.routes}>
          <Input id="routes" name="routes" defaultValue={campaign?.routes ?? ""} placeholder="C012, C014" />
        </Field>
        <Field label="Homes" htmlFor="homes" error={e.homes}>
          <Input
            key={formatId}
            id="homes"
            name="homes"
            inputMode="numeric"
            defaultValue={campaign?.homes ?? selected?.homes_default ?? ""}
          />
        </Field>
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-4">
        <legend className="mb-2 text-sm font-semibold">Dates</legend>
        {date("sales_open_date", "Sales open")}
        {date("sales_deadline", "Sales deadline")}
        {date("artwork_deadline", "Artwork deadline")}
        {date("drop_date", "Drop date")}
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-4">
        <legend className="mb-2 text-sm font-semibold">Costs and targets</legend>
        {money("postage_cost_cents", "Postage")}
        {money("print_cost_cents", "Print")}
        {money("other_cost_cents", "Other costs")}
        <div />
        <Field
          label="Min spots to go"
          htmlFor="min_spots_to_go"
          error={e.min_spots_to_go}
          hint="Go/no-go threshold"
        >
          <Input
            id="min_spots_to_go"
            name="min_spots_to_go"
            inputMode="numeric"
            defaultValue={campaign?.min_spots_to_go ?? ""}
          />
        </Field>
        <Field label="Run (months)" htmlFor="run_months" error={e.run_months} hint="Community cards: 3">
          <Input
            id="run_months"
            name="run_months"
            inputMode="numeric"
            defaultValue={campaign?.run_months ?? 1}
          />
        </Field>
      </fieldset>

      <Field label="Notes" htmlFor="notes" error={e.notes}>
        <Textarea id="notes" name="notes" defaultValue={campaign?.notes ?? ""} />
      </Field>

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
