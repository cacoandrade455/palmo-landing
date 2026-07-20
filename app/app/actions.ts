"use server";

import { getServerSupabase } from "@/lib/supabase-server";

export type HomeListing = {
  id: string;
  title: string;
  status: string;
  state: string;
  municipality: string;
  hectares: number;
  created_at: string;
};

export type HomeSummary = {
  listingCount: number;
  recentListings: HomeListing[];
  conversationCount: number;
  unreadCount: number;
};

export type HomeSummaryResult =
  | { ok: true; summary: HomeSummary }
  | { ok: false; error: string };

export async function getHomeSummary(): Promise<HomeSummaryResult> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_signed_in" };

  const [listingsRes, conversationsRes, unreadRes] = await Promise.all([
    supabase
      .from("listings")
      .select("id, title, status, state, municipality, hectares, created_at", {
        count: "exact",
      })
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(2),
    // RLS already limits conversations to the ones this user takes part in.
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true }),
    supabase.rpc("unread_conversation_count"),
  ]);

  if (listingsRes.error) return { ok: false, error: listingsRes.error.message };
  if (conversationsRes.error)
    return { ok: false, error: conversationsRes.error.message };

  return {
    ok: true,
    summary: {
      listingCount: listingsRes.count ?? 0,
      recentListings: (listingsRes.data ?? []) as HomeListing[],
      conversationCount: conversationsRes.count ?? 0,
      unreadCount:
        !unreadRes.error && typeof unreadRes.data === "number"
          ? unreadRes.data
          : 0,
    },
  };
}
