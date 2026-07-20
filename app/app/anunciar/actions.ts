"use server";

import { getServerSupabase } from "@/lib/supabase-server";

export type CreateListingResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createListing(
  formData: FormData,
): Promise<CreateListingResult> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: "unconfigured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_signed_in" };

  const title = String(formData.get("title") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const municipality = String(formData.get("municipality") ?? "").trim();
  const hectares = Number(formData.get("hectares") ?? 0);
  const purpose = String(formData.get("purpose") ?? "").trim();
  const crop = String(formData.get("crop") ?? "").trim() || null;
  const priceRaw = String(formData.get("price_per_ha_year") ?? "").trim();
  const price_per_ha_year = priceRaw ? Number(priceRaw) : null;
  const descriptionRaw = String(formData.get("description") ?? "").trim();
  // Variety has no dedicated column yet (schema is untouchable for agents),
  // so it is persisted non-destructively as a prefix inside the description.
  const variant = String(formData.get("variant") ?? "").trim();
  const description = variant
    ? `Variedade: ${variant}.${descriptionRaw ? ` ${descriptionRaw}` : ""}`
    : descriptionRaw || null;
  const has_water = formData.get("has_water") === "on";
  const car_number = String(formData.get("car_number") ?? "").trim() || null;
  const matricula = String(formData.get("matricula") ?? "").trim() || null;
  const publish = formData.get("publish") === "true";

  if (!title || !state || !municipality || !purpose || !hectares || hectares <= 0) {
    return { ok: false, error: "missing_fields" };
  }

  const { data, error } = await supabase
    .from("listings")
    .insert({
      owner_id: user.id,
      title,
      status: publish ? "active" : "draft",
      state,
      municipality,
      hectares,
      purpose,
      crop,
      price_per_ha_year,
      description,
      has_water,
      car_number,
      matricula,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id };
}
