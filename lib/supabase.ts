import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client — uses the service role key, which bypasses Row Level
 * Security. This must ONLY ever be imported from server code (API routes), never
 * from a client component or exposed to the browser.
 *
 * Per architecture-notes.md, all reads/writes in v1 go through Next.js API routes
 * rather than a direct browser-to-Supabase client, so only a server client is
 * needed for now.
 */
export function getServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase server env vars. Check NEXT_PUBLIC_SUPABASE_URL and " +
        "SUPABASE_SERVICE_ROLE_KEY are set (see .env.example)."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
