import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Data Access Layer check. Every admin page and Server Action calls this.
 * The proxy only does an optimistic redirect; this is the real gate.
 * Returns a Supabase client scoped to the admin's session.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS on `admins` lets a user read only their own row.
  const { data: admin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) redirect("/login?error=not_admin");

  return { supabase, user };
}
