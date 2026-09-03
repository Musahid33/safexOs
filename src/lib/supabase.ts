import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Role } from "./types";

let client: SupabaseClient | null = null;

export const isSupabaseMode =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
  process.env.NEXT_PUBLIC_DEMO_MODE !== "true";

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseMode) return null;
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: true, autoRefreshToken: true } }
    );
  }
  return client;
}

// ── Supabase auth helpers (used when live mode is on) ────────
export async function supabaseLogin(email: string, password: string) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const { data: profile } = await sb
    .from("profiles")
    .select("*")
    .eq("user_id", data.user.id)
    .single();
  return { user: data.user, profile };
}

export async function supabaseLogout() {
  const sb = getSupabase();
  if (sb) await sb.auth.signOut();
}

export function profileToAuth(profile: any, userId: string): { name: string; role: Role; companyId: string } {
  return {
    name: profile?.full_name ?? profile?.email?.split("@")[0] ?? "User",
    role: (profile?.role as Role) ?? "employee",
    companyId: profile?.company_id ?? "",
  };
}
