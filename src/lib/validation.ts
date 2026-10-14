import { z } from "zod";
import { dollarsToCents } from "@/lib/money";
import {
  CAMPAIGN_STATUSES,
  CONTACT_SOURCES,
  CREATIVE_STATUSES,
  PAID_STATUSES,
  PIPELINE_STAGES,
  PAYMENT_METHODS,
  SPOT_STATUSES,
} from "@/lib/types";

// Form-field helpers: FormData gives strings; blank means "not set".
const blankToNull = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? null : v;

const optText = z.preprocess(
  blankToNull,
  z.string().trim().max(2000).nullable().default(null),
);
const reqText = z.string().trim().min(1, "Required").max(200);
const optDate = z.preprocess(
  blankToNull,
  z.iso.date({ message: "Use YYYY-MM-DD" }).nullable().default(null),
);
const optInt = z.preprocess(
  (v) => (blankToNull(v) === null ? null : Number(String(v).replace(/,/g, ""))),
  z.number().int().min(0).nullable().default(null),
);
const inches = z.coerce.number().positive().max(100);
const optInches = z.preprocess(
  (v) => (blankToNull(v) === null ? null : Number(v)),
  z.number().min(0).max(100).nullable().default(null),
);
/** Dollar input → integer cents. Blank → 0 unless nullable is requested. */
const cents = z.preprocess(
  (v) => dollarsToCents(typeof v === "string" ? v : null) ?? 0,
  z.number().int().min(0),
);
const optCents = z.preprocess(
  (v) => dollarsToCents(typeof v === "string" ? v : null),
  z.number().int().min(0).nullable(),
);

export const formatSchema = z.object({
  name: reqText,
  width_in: inches,
  height_in: inches,
  homes_default: optInt,
  notes: optText,
});

export const formatSpotSchema = z.object({
  code: z.string().trim().min(1).max(12),
  side: z.enum(["front", "back"]),
  size_label: reqText,
  width_in: inches,
  height_in: inches,
  default_price_cents: cents,
  default_status: z.enum(["open", "house"]).default("open"),
  x_in: optInches,
  y_in: optInches,
  sort_order: z.coerce.number().int().default(0),
});

const campaignBase = z.object({
    name: reqText,
    format_id: z.uuid(),
    area: optText,
    routes: optText,
    homes: optInt,
    status: z.enum(CAMPAIGN_STATUSES),
    sales_open_date: optDate,
    sales_deadline: optDate,
    artwork_deadline: optDate,
    drop_date: optDate,
    postage_cost_cents: cents,
    print_cost_cents: cents,
    other_cost_cents: cents,
    min_spots_to_go: optInt,
    run_months: z.coerce.number().int().min(1).max(24).default(1),
    notes: optText,
});

const deadlineCheck = {
  check: (c: { sales_deadline: string | null; drop_date: string | null }) =>
    !c.sales_deadline || !c.drop_date || c.sales_deadline <= c.drop_date,
  opts: { message: "Sales deadline must be on or before the drop date", path: ["sales_deadline"] },
};

export const campaignSchema = campaignBase.refine(deadlineCheck.check, deadlineCheck.opts);

/** Campaign edits can't change the format (spots were copied at creation). */
export const campaignUpdateSchema = campaignBase
  .omit({ format_id: true })
  .refine(deadlineCheck.check, deadlineCheck.opts);

export const spotUpdateSchema = z
  .object({
    status: z.enum(SPOT_STATUSES),
    category: optText,
    price_cents: cents,
    contact_id: z.preprocess(blankToNull, z.uuid().nullable().default(null)),
    new_business_name: optText,
    sold_price_cents: optCents,
    paid_status: z.enum(PAID_STATUSES),
    paid_cents: cents,
    payment_method: z.preprocess(blankToNull, z.enum(PAYMENT_METHODS).nullable().default(null)),
    stripe_ref: optText,
    creative_status: z.enum(CREATIVE_STATUSES),
  })
  .refine((s) => s.status !== "sold" || s.contact_id || s.new_business_name, {
    message: "Pick or add the business that bought this spot",
    path: ["contact_id"],
  });

const optUrl = z.preprocess(
  (v) => {
    const b = blankToNull(v);
    if (typeof b !== "string") return b;
    const t = b.trim();
    return /^https?:\/\//i.test(t) ? t : `https://${t}`;
  },
  z.url({ message: "Enter a valid web address" }).max(500).nullable().default(null),
);

/** Comma-separated tags → lowercase, de-duplicated array. */
const tags = z.preprocess(
  (v) =>
    typeof v === "string"
      ? [...new Set(v.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))]
      : [],
  z.array(z.string().max(40)).max(30),
);

export const contactSchema = z.object({
  business_name: reqText,
  contact_name: optText,
  phone: z.preprocess(blankToNull, z.string().trim().max(40).nullable().default(null)),
  email: z.preprocess(
    blankToNull,
    z.email({ message: "Enter a valid email" }).max(200).nullable().default(null),
  ),
  category: optText,
  website: optUrl,
  facebook_url: optUrl,
  address: optText,
  source: z.preprocess(blankToNull, z.enum(CONTACT_SOURCES).nullable().default(null)),
  pipeline_stage: z.enum(PIPELINE_STAGES),
  tags,
  notes: optText,
});

export type FieldErrors = Record<string, string[] | undefined>;

export type ActionState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: FieldErrors;
};

export function formToObject(form: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries(form.entries());
}

export function toFieldErrors(error: z.ZodError): FieldErrors {
  return z.flattenError(error).fieldErrors as FieldErrors;
}
