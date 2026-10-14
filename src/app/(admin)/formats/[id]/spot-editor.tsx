"use client";

import { useActionState, useTransition } from "react";
import { centsToDollarInput } from "@/lib/money";
import type { FormatSpot } from "@/lib/types";
import type { ActionState } from "@/lib/validation";
import { Button, Input, Select, cn } from "@/components/ui";
import { deleteFormat, deleteFormatSpot } from "../actions";

const cell = "px-1 py-1 align-top";
const small = "px-1.5 py-1";

export function FormatSpotRow({
  formatId,
  spot,
  action,
  nextOrder,
}: {
  formatId: string;
  spot?: FormatSpot;
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  nextOrder?: number;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [deleting, startDelete] = useTransition();
  const formId = `spot-${spot?.id ?? "new"}`;
  const e = state.fieldErrors ?? {};
  const err = (k: string) => (e[k] ? "border-red-500" : undefined);

  return (
    <>
      <tr className={cn("border-t border-stone-100", !spot && "bg-stone-50")}>
        <td className={cell}>
          <form id={formId} action={formAction} />
          <Input form={formId} name="code" defaultValue={spot?.code} required placeholder={spot ? "" : "New"} className={cn(small, "w-16 uppercase", err("code"))} />
        </td>
        <td className={cell}>
          <Select form={formId} name="side" defaultValue={spot?.side ?? "front"} className={cn(small, "w-24")}>
            <option value="front">Front</option>
            <option value="back">Back</option>
          </Select>
        </td>
        <td className={cell}>
          <Input form={formId} name="size_label" defaultValue={spot?.size_label ?? "Single"} required className={cn(small, "w-36", err("size_label"))} />
        </td>
        <td className={cell}>
          <Input form={formId} name="width_in" defaultValue={spot?.width_in} required inputMode="decimal" className={cn(small, "w-16", err("width_in"))} />
        </td>
        <td className={cell}>
          <Input form={formId} name="height_in" defaultValue={spot?.height_in} required inputMode="decimal" className={cn(small, "w-16", err("height_in"))} />
        </td>
        <td className={cell}>
          <Input form={formId} name="default_price_cents" defaultValue={centsToDollarInput(spot?.default_price_cents)} inputMode="decimal" placeholder="$" className={cn(small, "w-20", err("default_price_cents"))} />
        </td>
        <td className={cell}>
          <Select form={formId} name="default_status" defaultValue={spot?.default_status ?? "open"} className={cn(small, "w-24")}>
            <option value="open">For sale</option>
            <option value="house">House</option>
          </Select>
        </td>
        <td className={cell}>
          <Input form={formId} name="x_in" defaultValue={spot?.x_in ?? ""} inputMode="decimal" className={cn(small, "w-14", err("x_in"))} />
        </td>
        <td className={cell}>
          <Input form={formId} name="y_in" defaultValue={spot?.y_in ?? ""} inputMode="decimal" className={cn(small, "w-14", err("y_in"))} />
        </td>
        <td className={cell}>
          <Input form={formId} name="sort_order" defaultValue={spot?.sort_order ?? nextOrder ?? 0} inputMode="numeric" className={cn(small, "w-14")} />
        </td>
        <td className={cn(cell, "whitespace-nowrap")}>
          <Button form={formId} type="submit" variant="secondary" className="px-2 py-1" disabled={pending}>
            {pending ? "…" : spot ? "Save" : "Add"}
          </Button>
          {spot ? (
            <Button
              type="button"
              variant="ghost"
              className="ml-1 px-2 py-1 text-red-700"
              disabled={deleting}
              onClick={() => {
                if (confirm(`Delete spot ${spot.code} from this format?`)) {
                  startDelete(() => deleteFormatSpot(formatId, spot.id));
                }
              }}
            >
              Delete
            </Button>
          ) : null}
        </td>
      </tr>
      {state.message || Object.keys(e).length ? (
        <tr>
          <td colSpan={11} className={cn("px-1 pb-2 text-xs", state.ok ? "text-green-700" : "text-red-600")}>
            {state.message ??
              Object.entries(e)
                .map(([k, v]) => `${k}: ${v?.[0]}`)
                .join(" · ")}
          </td>
        </tr>
      ) : null}
    </>
  );
}

export function DeleteFormatButton({ formatId }: { formatId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="danger"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this format and all its spots?")) return;
        start(async () => {
          const res = await deleteFormat(formatId);
          if (res?.message) alert(res.message);
        });
      }}
    >
      Delete format
    </Button>
  );
}
