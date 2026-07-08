"use server";

import { getServerSupabase } from "@/lib/supabase-server";

export type InboxItem = {
  id: string;
  listing_id: string;
  listingTitle: string;
  counterpartName: string | null;
  role: "owner" | "developer"; // my role in this conversation
  deal_status: string;
  updated_at: string;
};

export async function getInbox(): Promise<
  { ok: true; items: InboxItem[] } | { ok: false; error: string }
> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_signed_in" };

  const { data, error } = await supabase
    .from("conversations")
    .select("id, listing_id, developer_id, owner_id, deal_status, updated_at")
    .order("updated_at", { ascending: false });
  if (error) return { ok: false, error: error.message };

  const items: InboxItem[] = [];
  for (const c of data ?? []) {
    const iAmOwner = c.owner_id === user.id;
    const otherId = iAmOwner ? c.developer_id : c.owner_id;

    const [{ data: listing }, { data: other }] = await Promise.all([
      supabase.from("listings").select("title").eq("id", c.listing_id).single(),
      supabase.from("public_profiles").select("display_name").eq("id", otherId).single(),
    ]);

    items.push({
      id: c.id,
      listing_id: c.listing_id,
      listingTitle: listing?.title ?? "—",
      counterpartName: other?.display_name ?? null,
      role: iAmOwner ? "owner" : "developer",
      deal_status: c.deal_status,
      updated_at: c.updated_at,
    });
  }
  return { ok: true, items };
}
