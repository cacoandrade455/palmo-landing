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

export type HomeContract = {
  id: string;
  status: string;
  current_version: number;
  type: string;
  listingTitle: string | null;
};

export type HomeSummary = {
  listingCount: number;
  recentListings: HomeListing[];
  conversationCount: number;
  unreadCount: number;
  contractCount: number;
  latestContract: HomeContract | null;
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

  const [listingsRes, conversationsRes, unreadRes, contractsRes] = await Promise.all([
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
    // RLS limits contracts to conversations this user takes part in.
    // Fails graciously (0/null) if the Lote B migration isn't applied yet.
    supabase
      .from("contracts")
      .select("id, status, current_version, type, created_at, listings(title)", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  if (listingsRes.error) return { ok: false, error: listingsRes.error.message };
  if (conversationsRes.error)
    return { ok: false, error: conversationsRes.error.message };

  let contractCount = 0;
  let latestContract: HomeContract | null = null;
  if (!contractsRes.error) {
    contractCount = contractsRes.count ?? 0;
    const row = contractsRes.data?.[0] as
      | {
          id: string;
          status: string;
          current_version: number;
          type: string;
          listings: { title: string } | { title: string }[] | null;
        }
      | undefined;
    if (row) {
      const joined = Array.isArray(row.listings) ? row.listings[0] : row.listings;
      latestContract = {
        id: row.id,
        status: row.status,
        current_version: row.current_version,
        type: row.type,
        listingTitle: joined?.title ?? null,
      };
    }
  }

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
      contractCount,
      latestContract,
    },
  };
}
