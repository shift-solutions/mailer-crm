"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  formatSchema,
  formatSpotSchema,
  formToObject,
  toFieldErrors,
  type ActionState,
} from "@/lib/validation";

export async function createFormat(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const parsed = formatSchema.safeParse(formToObject(form));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const { data, error } = await supabase
    .from("card_formats")
    .insert(parsed.data)
    .select("id")
    .single();
  if (error) return { message: error.message };

  revalidatePath("/formats");
  redirect(`/formats/${data.id}`);
}

export async function updateFormat(
  formatId: string,
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const parsed = formatSchema.safeParse(formToObject(form));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const { error } = await supabase.from("card_formats").update(parsed.data).eq("id", formatId);
  if (error) return { message: error.message };

  revalidatePath(`/formats/${formatId}`);
  revalidatePath("/formats");
  return { ok: true, message: "Saved" };
}

export async function deleteFormat(formatId: string): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const { count } = await supabase
    .from("campaigns")
    .select("id", { count: "exact", head: true })
    .eq("format_id", formatId);
  if (count && count > 0) {
    return { message: `This format is used by ${count} campaign(s), so it can't be deleted.` };
  }
  const { error } = await supabase.from("card_formats").delete().eq("id", formatId);
  if (error) return { message: error.message };
  revalidatePath("/formats");
  redirect("/formats");
}

/** Create (no spotId) or update a format spot. */
export async function saveFormatSpot(
  formatId: string,
  spotId: string | null,
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const parsed = formatSpotSchema.safeParse(formToObject(form));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const row = { ...parsed.data, code: parsed.data.code.toUpperCase() };
  const { error } = spotId
    ? await supabase.from("format_spots").update(row).eq("id", spotId).eq("format_id", formatId)
    : await supabase.from("format_spots").insert({ ...row, format_id: formatId });
  if (error) {
    return {
      message: error.code === "23505" ? `Spot code ${row.code} already exists.` : error.message,
    };
  }

  revalidatePath(`/formats/${formatId}`);
  return { ok: true, message: spotId ? "Saved" : `Added ${row.code}` };
}

export async function deleteFormatSpot(formatId: string, spotId: string): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("format_spots").delete().eq("id", spotId).eq("format_id", formatId);
  revalidatePath(`/formats/${formatId}`);
}
