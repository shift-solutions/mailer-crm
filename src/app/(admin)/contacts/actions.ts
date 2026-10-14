"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { contactSchema, formToObject, toFieldErrors, type ActionState } from "@/lib/validation";

export async function createContact(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const parsed = contactSchema.safeParse(formToObject(form));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const { data, error } = await supabase
    .from("contacts")
    .insert(parsed.data)
    .select("id")
    .single();
  if (error) return { message: error.message };

  revalidatePath("/contacts");
  redirect(`/contacts/${data.id}`);
}

export async function updateContact(
  contactId: string,
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const parsed = contactSchema.safeParse(formToObject(form));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const { error } = await supabase.from("contacts").update(parsed.data).eq("id", contactId);
  if (error) return { message: error.message };

  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/contacts");
  return { ok: true, message: "Saved" };
}

/** Quick stage change from the business page header. */
export async function setPipelineStage(contactId: string, stage: string): Promise<void> {
  const { supabase } = await requireAdmin();
  const parsed = contactSchema.shape.pipeline_stage.safeParse(stage);
  if (!parsed.success) return;
  await supabase.from("contacts").update({ pipeline_stage: parsed.data }).eq("id", contactId);
  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/contacts");
}

export async function deleteContact(contactId: string): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const { count } = await supabase
    .from("campaign_spots")
    .select("id", { count: "exact", head: true })
    .eq("contact_id", contactId)
    .in("status", ["sold", "held"]);
  if (count && count > 0) {
    return {
      message: `This business has ${count} sold or held spot(s). Reopen those spots first, or mark the business as lost instead.`,
    };
  }
  const { error } = await supabase.from("contacts").delete().eq("id", contactId);
  if (error) return { message: error.message };
  revalidatePath("/contacts");
  redirect("/contacts");
}
