import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Supported env vars for the frontend Supabase client.
// Prefer Vite-style names in development: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
// We also support legacy or host-exported fallbacks: VITE_PUBLIC_SUPABASE_URL,
// VITE_PUBLIC_SUPABASE_ANON_KEY, and NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.
const env = import.meta.env as Record<string, string | undefined>;
const supabaseUrl =
  env.VITE_SUPABASE_URL ?? env.VITE_PUBLIC_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  env.VITE_SUPABASE_ANON_KEY ?? env.VITE_PUBLIC_SUPABASE_ANON_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
