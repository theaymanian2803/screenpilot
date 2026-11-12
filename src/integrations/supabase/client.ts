import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client.
 *
 * The app only uses Supabase Realtime (broadcast + presence) to pair the desktop
 * dashboard with the phone remote, so no auth session or database access is
 * needed here. Point VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY at any
 * Supabase project to use the built-in relay.
 */
function createSupabaseClient(): SupabaseClient {
  const url = import.meta.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"];
  const key =
    import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || process.env["SUPABASE_PUBLISHABLE_KEY"];

  if (!url || !key) {
    throw new Error(
      "Supabase Realtime relay is not configured. Set VITE_SUPABASE_URL and " +
        "VITE_SUPABASE_PUBLISHABLE_KEY, or enter your own relay server URL in the app.",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let client: SupabaseClient | undefined;

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop, receiver) {
    if (!client) client = createSupabaseClient();
    return Reflect.get(client, prop, receiver);
  },
});
