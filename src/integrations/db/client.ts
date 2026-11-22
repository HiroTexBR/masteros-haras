// Browser Supabase client. URL + anon key are PUBLIC values (RLS enforces access).
// Do NOT put the service role key here.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bczomifpddrwgmxopgjb.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjem9taWZwZGRyd2dteG9wZ2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNzI4MTEsImV4cCI6MjA5ODk0ODgxMX0.TyerGH3mmGAEFdLo84TZM6257RAK_lQr_Qvz68wyX9k";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "masteros-auth",
  },
});

export const SUPABASE_PUBLIC_URL = SUPABASE_URL;
export const SUPABASE_PUBLIC_ANON_KEY = SUPABASE_ANON_KEY;
