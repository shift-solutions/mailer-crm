"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { derivePayment } from "@/lib/spots";
import {
  campaignSchema,
  campaignUpdateSchema,
  formToObject,
  spotUpdateSchema,
  toFieldErrors,
  type ActionState,
} from "@/lib/validation";

export async function createCampaign(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const parsed = campaignSchema.safeParse(formToObject(form));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  // A database trigger copies the format's spots into campaign_spots.
  const { data, error } = await supabase
    .from("campaigns")
    .insert(parsed.data)
    .select("id")
    .single();
  if (error) return { message: error.message };

  revalidatePath("/campaigns");
  revalidatePath("/");
  redirect(`/campaigns/${data.id}`);
}

export async function updateCampaign(
  campaignId: string,
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const parsed = campaignUpdateSchema.safeParse(formToObject(form));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const { error } = await supabase.from("campaigns").update(parsed.data).eq("id", campaignId);
  if (error) return { message: error.message };

  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/campaigns");
  revalidatePath("/");
  return { ok: true, message: "Saved" };
}

export async function deleteCampaign(campaignId: string): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const { count } = await supabase
    .from("campaign_spots")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .eq("status", "sold");
  if (count && count > 0) {
    return {
      message: `This campaign has ${count} sold spot(s). Set them back to open first, or close the campaign instead.`,
    };
  }
  const { error } = await supabase.from("campaigns").delete().eq("id", campaignId);
  if (error) return { message: error.message };
  revalidatePath("/campaigns");
  revalidatePath("/");
  redirect("/campaigns");
}

export async function updateSpot(
  campaignId: string,
  spotId: string,
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const parsed = spotUpdateSchema.safeParse(formToObject(form));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };
  const input = parsed.data;

  // Open and house spots have no buyer.
  const hasBuyer = input.status === "sold" || input.status === "held";
  let contactId = hasBuyer ? input.contact_id : null;

  if (hasBuyer && !contactId && input.new_business_name) {
    const { data: created, error } = await supabase
      .from("contacts")
      .insert({
        business_name: input.new_business_name,
        category: input.category,
        pipeline_stage: input.status === "sold" ? "customer" : "interested",
      })
      .select("id")
      .single();
    if (error) return { message: error.message };
    contactId = created.id;
  }

  const soldPrice =
    input.status === "sold" ? (input.sold_price_cents ?? input.price_cents) : null;
  const payment = derivePayment({
    status: input.status,
    soldPriceCents: soldPrice,
    paidCents: input.paid_cents,
    paidStatus: input.paid_status,
  });

  const { error } = await supabase
    .from("campaign_spots")
    .update({
      status: input.status,
      category: input.category,
      price_cents: input.price_cents,
      contact_id: contactId,
      sold_price_cents: soldPrice,
      paid_status: payment.paidStatus,
      paid_cents: payment.paidCents,
      payment_method: payment.paidCents > 0 ? input.payment_method : null,
      stripe_ref: input.payment_method === "stripe" ? input.stripe_ref : null,
      creative_status: input.status === "open" ? "none" : input.creative_status,
    })
    .eq("id", spotId)
    .eq("campaign_id", campaignId);
  if (error) return { message: error.message };

  // A sale moves the contact to "customer" in the pipeline.
  if (input.status === "sold" && contactId) {
    await supabase
      .from("contacts")
      .update({ pipeline_stage: "customer" })
      .eq("id", contactId)
      .neq("pipeline_stage", "customer");
  }

  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/campaigns");
  revalidatePath("/");
  return { ok: true, message: "Spot saved" };
}
