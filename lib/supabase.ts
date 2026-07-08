"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client. Uses @supabase/ssr's createBrowserClient so the
 * auth session is stored in COOKIES (not localStorage). This lets the server
 * (proxy + Server Actions) read the same session — required for server-side
 * auth like creating a listing.
 *
 * Returns null if env vars are missing (auth UI then simply doesn't render).
 */
let client: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  client = url && key ? createBrowserClient(url, key) : null;
  return client;
}
