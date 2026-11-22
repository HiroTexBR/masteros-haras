// SERVER-ONLY. Service role bypasses RLS. Never import from client-reachable modules
// at module scope — use `await import("@/integrations/db/client.server")` inside handlers.
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLIC_URL } from "./client";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export function getSupabaseAdmin() {
  return createClient(SUPABASE_PUBLIC_URL, requireEnv("APP_DB_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Authenticated server-side client acting as a specific user (bearer token). */
export function getSupabaseAsUser(accessToken: string) {
  return createClient(SUPABASE_PUBLIC_URL, requireEnv("APP_DB_ANON_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
