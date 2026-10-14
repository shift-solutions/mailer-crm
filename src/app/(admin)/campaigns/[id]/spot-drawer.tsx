"use client";

import { useActionState, useState } from "react";
import { centsToDollarInput, formatCents } from "@/lib/money";
import {
  CREATIVE_LABELS,
  CREATIVE_STATUSES,
  PAYMENT_METHODS,
  SPOT_STATUSES,
  type ContactOption,
  type PaidStatus,
  type SpotStatus,
  type SpotWithContact,
} from "@/lib/types";
import { Button, Field, Input, Select, cn } from "@/components/ui";
import { Drawer } from "@/components/drawer";
import { spotStatusClass } from "@/components/card-side";
import { updateSpot } from "../actions";

const NEW_CONTACT = "__new__";

export function SpotDrawer({
  campaignId,
  spot,
  contacts,
  onClose,
}: {
  campaignId: string;
  spot: SpotWithContact;
  contacts: ContactOption[];
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    updateSpot.bind(null, campaignId, spot.id),
    {},
  );
  const [status, setStatus] = useState<SpotStatus>(spot.status);
  const [contactChoice, setContactChoice] = useState(spot.contact_id ?? "");
  const [paidStatus, setPaidStatus] = useState<PaidStatus>(spot.paid_status);
  const [paidInput, setPaidInput] = useState(centsToDollarInput(spot.paid_cents || null));
  const [method, setMethod] = useState(spot.payment_method ?? "");
  const e = state.fieldErrors ?? {};
  const hasBuyer = status === "sold" || status === "held";

  return (
    <Drawer
      title={`Spot ${spot.code}`}
      description={
        <>
          <span className="capitalize">{spot.side}</span>
          {" · "}
          {spot.size_label}
          {" · "}
          <span className="tabular">
            {spot.width_in}&Prime; × {spot.height_in}&Prime;
          </span>
        </>
      }
      onClose={onClose}
    >
      <form action={formAction} className="flex min-h-full flex-col">
        <div className="flex-1 space-y-5 px-5 py-5">
          {/* Status */}
          <fieldset>
            <legend className="mb-1.5 text-xs font-medium text-stone-600">Status</legend>
            <input type="hidden" name="status" value={status} />
            <div className="grid grid-cols-4 gap-1">
              {SPOT_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  aria-pressed={status === s}
                  className={cn(
                    "rounded-lg border px-2 py-1.5 text-sm capitalize transition-colors",
                    status === s ? cn(spotStatusClass[s], "border-solid font-semibold ring-2 ring-stone-900") : "border-stone-200 text-stone-600 hover:bg-stone-50",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Buyer */}
          {hasBuyer ? (
            <div className="space-y-3">
              <Field label="Business" htmlFor="contact_id" error={e.contact_id}>
                <Select
                  id="contact_id"
                  name="contact_id"
                  value={contactChoice === NEW_CONTACT ? "" : contactChoice}
                  onChange={(ev) => setContactChoice(ev.target.value)}
                >
                  <option value="">Choose a business…</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.business_name}
                    </option>
                  ))}
                </Select>
              </Field>
              {contactChoice === "" || contactChoice === NEW_CONTACT ? (
                <Field label="…or add a new business" htmlFor="new_business_name" hint="Creates a contact you can fill in later.">
                  <Input
                    id="new_business_name"
                    name="new_business_name"
                    placeholder="Business name"
                    onFocus={() => setContactChoice(NEW_CONTACT)}
                  />
                </Field>
              ) : null}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category" htmlFor="category" error={e.category} className="col-span-2">
              <Input id="category" name="category" defaultValue={spot.category ?? ""} placeholder="Lawn Care" />
            </Field>
            <Field label="List price" htmlFor="price_cents" error={e.price_cents}>
              <Input id="price_cents" name="price_cents" inputMode="decimal" defaultValue={centsToDollarInput(spot.price_cents)} />
            </Field>
            {status === "sold" ? (
              <Field label="Sold price" htmlFor="sold_price_cents" error={e.sold_price_cents} hint="After discounts. Blank = list price.">
                <Input
                  id="sold_price_cents"
                  name="sold_price_cents"
                  inputMode="decimal"
                  defaultValue={centsToDollarInput(spot.sold_price_cents)}
                  placeholder={centsToDollarInput(spot.price_cents)}
                />
              </Field>
            ) : null}
          </div>

          {/* Payment */}
          {hasBuyer || spot.paid_cents > 0 ? (
            <fieldset className="space-y-3 rounded-xl border border-stone-200 p-3.5">
              <legend className="px-1 text-xs font-medium text-stone-600">Payment</legend>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Amount received" htmlFor="paid_cents" error={e.paid_cents}>
                  <Input id="paid_cents" name="paid_cents" inputMode="decimal" placeholder="$0" value={paidInput} onChange={(ev) => setPaidInput(ev.target.value)} />
                </Field>
                <Field label="Paid status" htmlFor="paid_status" hint="Set from the amount unless refunded">
                  <Select id="paid_status" name="paid_status" value={paidStatus} onChange={(ev) => setPaidStatus(ev.target.value as PaidStatus)}>
                    <option value="unpaid">Unpaid</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                    <option value="refunded">Refunded</option>
                  </Select>
                </Field>
                <Field label="Method" htmlFor="payment_method">
                  <Select id="payment_method" name="payment_method" value={method} onChange={(ev) => setMethod(ev.target.value)}>
                    <option value="">—</option>
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m[0].toUpperCase() + m.slice(1)}
                      </option>
                    ))}
                  </Select>
                </Field>
                {method === "stripe" ? (
                  <Field label="Stripe reference" htmlFor="stripe_ref">
                    <Input id="stripe_ref" name="stripe_ref" defaultValue={spot.stripe_ref ?? ""} placeholder="pi_…" />
                  </Field>
                ) : null}
              </div>
              {status === "sold" ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setPaidStatus("paid");
                    setPaidInput("");
                  }}
                >
                  Mark paid in full
                </Button>
              ) : null}
            </fieldset>
          ) : (
            <>
              <input type="hidden" name="paid_status" value="unpaid" />
              <input type="hidden" name="paid_cents" value="" />
            </>
          )}

          {hasBuyer ? (
            <Field label="Creative" htmlFor="creative_status">
              <Select id="creative_status" name="creative_status" defaultValue={spot.creative_status}>
                {CREATIVE_STATUSES.map((c) => (
                  <option key={c} value={c}>
                    {CREATIVE_LABELS[c]}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <input type="hidden" name="creative_status" value="none" />
          )}
        </div>

        <div className="sticky bottom-0 mt-auto flex items-center gap-3 border-t border-stone-200/80 bg-white px-5 py-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save spot"}
            </Button>
            {state.message ? (
              <p className={state.ok ? "text-sm text-green-700" : "text-sm text-red-600"} role="status">
                {state.message}
              </p>
            ) : Object.keys(e).length ? (
              <p className="text-sm text-red-600">{Object.values(e)[0]?.[0]}</p>
            ) : null}
            {spot.status === "sold" && spot.sold_at ? (
              <p className="ml-auto text-xs text-stone-500 tabular">
                Sold {new Date(spot.sold_at).toLocaleDateString()} · {formatCents(spot.sold_price_cents)}
              </p>
            ) : null}
          </div>
        </form>
    </Drawer>
  );
}
