import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Supported env vars for the frontend Supabase client.
// Prefer Vite-style names in development: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
// We also support legacy or host-exported fallbacks: VITE_PUBLIC_SUPABASE_URL,
// VITE_PUBLIC_SUPABASE_ANON_KEY, and NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.
const env = import.meta.env as Record<string, string | undefined>;
export const supabaseUrl =
  env.VITE_SUPABASE_URL ?? env.VITE_PUBLIC_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey =
  env.VITE_SUPABASE_ANON_KEY ?? env.VITE_PUBLIC_SUPABASE_ANON_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const looksLikeServiceRoleKey = (value?: string) => Boolean(value && /sb_secret_|service_role|service-role/i.test(value));
const looksLikePlaceholderKey = (value?: string) =>
  Boolean(value && /your-?anon|replace-with|placeholder|example/i.test(value));

export const supabaseConfigIssue = !supabaseUrl
  ? "Missing Supabase URL. Set VITE_SUPABASE_URL."
  : !supabaseAnonKey
    ? "Missing Supabase anon key. Set VITE_SUPABASE_ANON_KEY."
    : looksLikeServiceRoleKey(supabaseAnonKey)
      ? "The configured Supabase key looks like a service-role secret. Replace it with the public anon key from your Supabase project settings."
      : looksLikePlaceholderKey(supabaseAnonKey)
        ? "The configured Supabase anon key is still a placeholder. Replace it with the public anon key from your Supabase project settings."
        : "";

export const supabase: SupabaseClient | null = supabaseConfigIssue
  ? null
  : createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    });
